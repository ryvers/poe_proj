import React, { Component } from "react";
import { Container, Row, Col} from "reactstrap";
import { Card, Heading, Text, Button, Input, OutlineButton, Field, Table, Loader, ToastMessage, Link, Icon} from 'rimble-ui'
import ReactDropzone from "react-dropzone"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import CryptoJS from "crypto-js";
import moment from "moment";
import Camera from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';
import "./App.css";
import LogicPoe from "./contracts/LogicPoe.json";
import ProxyPoe from "./contracts/ProxyPoe.json"
import IpfsAPI from "ipfs-api";
import getWeb3 from "./utils/getWeb3";
import config from "./config";

class App extends Component {
  state = {
    contractAddr: "0x0",
    web3: null,
    accounts: null,
    contract: null,
    isUploading: false,
    isMyFilesLoading: false,
    isSearchLoading: false,
    fileHash: '',
    fileName: '',
    fileContent: '',
    fileHashToCheck: '',
    tags: '',
    ipfsAPI: null,
    checkedFile: null,
    ipfsUrl: '',
    networkType: '',
    myFiles: null,
    addedFile: null,
    PhotoCameraOn: false,
    maxFileSize: 1042880
  }

  constructor (props) {
    super(props);
    this.handleClick = this.handleClickUpload.bind(this);
    this.handleClick = this.handleClickCheck.bind(this);
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const networkType = await web3.eth.net.getNetworkType();
      const deployed = LogicPoe.networks[networkId];
      const proxy = ProxyPoe.networks[networkId];
      if(!deployed || !proxy){
          this.setState({ web3 });
          alert('No deployed contracts for this network');
          alert('Change network in MetaMask');
          return;
      }
      const instance = new web3.eth.Contract(
          LogicPoe.abi,
          deployed && proxy.address,
      );

      const ipfsAPI = IpfsAPI(config.ipfsNodeIP, config.ipfsNodePort, {protocol: 'http'});

      this.setState({ web3, accounts, ipfsAPI, contract: instance, contractAddr: instance.options.address, networkType: networkType, maxFileSize: config.maxSize });
    } catch (error) {
        alert('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
        alert(error);
    }
  };

  // HELPERS
  stringToBytes = (text) => {
      return this.state.web3.utils.utf8ToHex(text);
  }

  bytesToString = (bytes) => {
      return this.state.web3.utils.hexToUtf8(bytes);
  }

  handleChange = e => this.setState({ [e.target.name]: e.target.value });

  handleClickUpload = (e) => {
    this.setState({isUploading: true});
    this.refs.dropzone.open();
  }

  handleClickCheck = (e) => {
    this.setState({
        isSearchLoading: true
    });
    this.refs.dropzone2.open();
  }

  buildIpfsUrl = (ipfsHash) => {
    const ipfsBrowserAddress = "http://" + config.ipfsNodeIP + ":" + config.ipfsBrowserPort + "/ipfs/";
    return ipfsBrowserAddress + (ipfsHash);
  }

  dataURItoBlob = (dataURI) => {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }

  getFileHashFromContent = async () => {
    const fileToAdd = this.state.fileContent;
    const fileContentWordArray = CryptoJS.lib.WordArray.create(fileToAdd);
    const fileHash = await this.state.web3.utils.soliditySha3(fileContentWordArray).toString();
    return fileHash;
  }

  // ACTION METHODS
  fileDropped = async (acceptedFiles, rejectedFiles, captured) => {
    if(rejectedFiles.length > 0 && rejectedFiles[0].size > this.state.maxFileSize){
      window.toastProvider.addMessage('File is too large!', {
        secondaryMessage: "Files up to 5MB are allowed",
        variant: 'failure'
      });
      return;
    }

    acceptedFiles.forEach(file => {
      if(captured){
        this.setState({
          isUploading: true,
        });
      } else {
        this.setState({
          isUploading: true,
          fileName: file.name
        });
      }

      const reader = new FileReader();

      reader.onerror = (err) => {
        window.toastProvider.addMessage('Failed to read the file!', {
          secondaryMessage: "Check console for details",
          variant: 'failure'
        });
        this.setState({
          isUploadLoading: false,
        });
        alert(err);
      }

      reader.onload = async () => {
        const fileAsArrayBuffer = reader.result;
        this.setState({
          fileContent: fileAsArrayBuffer
        });

       this.setState({
         isUploading: false
       });
      };

      reader.readAsArrayBuffer(file);
    });
  };

  fileSelectedToCheck = async (acceptedFiles, rejectedFiles) => {
    if(rejectedFiles.length > 0 && rejectedFiles[0].size > this.state.maxFileSize){
      window.toastProvider.addMessage('File is too large!', {
        secondaryMessage: "Files up to 5MB are allowed",
        variant: 'failure'
      });
      return;
    }

    acceptedFiles.forEach(file => {
      this.setState({
          isSearchLoading: true,
      });
      const reader = new FileReader();

      reader.onerror = (err) => {
        this.setState({
            isSearchLoading: false,
        });
        window.toastProvider.addMessage('Failed to read the file!', {
          secondaryMessage: "Check console for details",
          variant: 'failure'
        });
        alert(err);
      }

      reader.onload = async () => {
        const fileAsArrayBuffer = reader.result;
        this.setState({
          fileContent: fileAsArrayBuffer,
          isSearchLoading: false
        });
        const hash = await this.getFileHashFromContent();

        this.setState({
          fileHashToCheck: hash
        });
        window.toastProvider.addMessage('File hash computed!', {
          secondaryMessage: 'Hash pasted to input, click Search',
          icon: 'InfoOutline'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  addFile = async() => {
    this.setState({
      isUploading: true
    });
    this.addFileRequest();
  }
  addFileRequest = async() => {
    const { accounts, contract } = this.state;
    var addedFile;

    try{
      const owner = accounts;
      const fileHash = await this.getFileHashFromContent();
      const epochTime = Math.round(moment().format('X'));
      console.log(moment().format('X'));

      //## save to ifps
      const fileIPFS = await this.state.ipfsAPI.files.add(Buffer.from(this.state.fileContent));
      console.log('Added to ipfs : ' + fileIPFS[0].hash);

      //## save to blockchain
      console.log('fileHash : ' + fileHash);
      var tags = this.stringToBytes(this.state.tags).padEnd(66, '0');
      var data = await contract.methods.addMyFile(epochTime, fileHash, tags, this.stringToBytes(fileIPFS[0].hash)).send({from: owner[0]});

      //check for event
      addedFile = {
        tx: data.transactionHash,
        ipfs: fileIPFS[0].hash,
        filehash: fileHash,
        tags: this.bytesToString(data.events.FileAdded.returnValues.tags)
      }
      console.log("tx: "+ data.transactionHash + "\nipfsHash: " + fileIPFS[0].hash + "\nfileHash: " + fileHash + "\ntags: " +
        addedFile.tags);

      window.toastProvider.addMessage('File has been added!', {
        secondaryMessage: "tx: "+ data.transactionHash,
        variant: 'success'
      });
    } catch (err) {
      window.toastProvider.addMessage('Failed to add file!', {
        secondaryMessage: "Check console for details",
        variant: 'failure'
      });
      alert(err);
      console.log(err);
    } finally {
      this.setState({
        addedFile: addedFile,
        isUploading: false
      });
    }
  }

  onTakePhoto = (dataUri) => {
    this.setState({
      fileName: 'Photo_from_Camera' + moment().format('X') + '.png',
    });
    var blob = this.dataURItoBlob(dataUri);
    this.fileDropped([blob],[],true);
  }

  getFile = async() => {
    const { fileHashToCheck, contract } = this.state;
    //validation
    if(fileHashToCheck.length !== 66){
      window.toastProvider.addMessage('Invalid Hash file!', {
        secondaryMessage: 'Hash should be 66 chars long',
        variant: 'failure'
      });
      return;
    }
    this.setState({
        isSearchLoading: true,
    });

    var data = await contract.methods.fileDetails(fileHashToCheck).call();

    if(data.ipfsHash === null){
      window.toastProvider.addMessage('File has not been found!', {
        secondaryMessage: 'File is not stored in the contract',
        variant: 'failure'
      });
      this.setState({
          isSearchLoading: false,
      });
      return;
    }

    this.setState({
      checkedFile: data,
      ipfsUrl: this.buildIpfsUrl(this.bytesToString(data.ipfsHash)),
      isSearchLoading: false
    })
    window.toastProvider.addMessage('File has been found!', {
      secondaryMessage: 'Details of the file are displayed',
      variant: 'success'
    });
  }

  getMyFiles = async() => {
    const { accounts, contract } = this.state;
    this.setState({
      isMyFilesLoading: true
    });

    var numberOfFiles = await contract.methods.getCountOfMyfiles().call({from: accounts[0]});
    numberOfFiles = parseInt(numberOfFiles);
    var myFiles = [];
    for(var i = 0; i < numberOfFiles; i++){
      var response = await contract.methods.getMyFileById(i).call({from: accounts[0]});
      myFiles.push(response);
    }

    myFiles = myFiles.map((item,index) =>
      <tr key={index+1}>
        <td style={{width: '10%'}}>{index+1}</td>
        <td style={{width: '20%'}}>{moment.unix(item[0]).format('DD-MM-YYYY HH:mm:ss')}</td>
        <td style={{wordBreak: 'break-all', width: '55%'}}>
          {item[1]}
        </td>
        <td style={{width: '15%'}}>
          <CopyToClipboard text={item[1]}
            onCopy={() => window.toastProvider.addMessage('Copy to clipboard', {
                  secondaryMessage: 'Now you can paste the file hash',
                  icon: 'InfoOutline'
                })}>
                <Link href='#!' onClick={this.onClick}>
                    <Icon name="ContentCopy" color="primary" size="16" />
                </Link>
          </CopyToClipboard>
        </td>
      </tr>
    );

    this.setState({
      isMyFilesLoading: false,
      myFiles: myFiles,
      numberOfMyFiles: numberOfFiles
    })
    window.toastProvider.addMessage('Files displayed', {
      secondaryMessage: 'Your files are listed',
      variant: 'success'
    });
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    } else if (!this.state.contract) {
      return <div>Bad network selected</div>;
    }
    return (
      <Container>
        <div className="App">
          <Container>
            <Card width={'70%'} style={{minWidth: '420px'}} mx={'auto'} px={4}>
              <Heading.h1>Proof Of Existence</Heading.h1>
              <Heading.h5>Store your files for future provenance</Heading.h5>
              <hr id="divider"/>
              <Text>
                Your address: {this.state.accounts[0]}
                <br/>
                Address of a contract: {this.state.contractAddr}
                <br/>
                Network used: {this.state.networkType}
              </Text>
            </Card>

            <Row>
              <Col>
                <Card width={'70%'} style={{minWidth: '420px'}} mx={'auto'} px={4}>
                  <Heading>Upload File</Heading>
                  <Text mb={4}>
                    Select file from your device or caputre the moment using camera. This will allow you to upload file and store it in the Inter Planetary
                    File System and store the details of the file in the Ethereum Smart Contract.
                  </Text>
                  {this.state.fileName === '' ?
                    (<div>
                      <Button onClick={this.handleClickUpload.bind(this)} mr={3} icon="AddCircle" iconpos="right">
                        Select file
                        <ReactDropzone multiple={false}
                          onDrop={(acceptedFiles, rejectedFiles) => this.fileDropped(acceptedFiles, rejectedFiles, false)}
                          ref="dropzone"
                          style={{display: 'none'}}
                          minSize={0}
                          maxSize={this.state.maxFileSize}>
                        </ReactDropzone>
                      </Button>
                      <OutlineButton icon="PhotoCamera" iconpos="right" onClick={() => this.setState({PhotoCameraOn: !this.state.PhotoCameraOn})}>Camera On/Off</OutlineButton>
                      <br/>
                      {this.state.PhotoCameraOn &&
                        <div style={{border: '1px solid #CCC', padding: '16px', marginTop: '32px'}}>
                          <Camera onTakePhoto = { (dataUri) => { this.onTakePhoto(dataUri); } } style={{width: '100%'}}/>
                        </div>
                      }
                    </div>) :
                    !this.state.addedFile ?
                    (<div>
                      <Text mb={4}>
                        Selected file: <b>{this.state.fileName}</b>
                      </Text>
                      {this.state.isUploading === false ?
                        <div>
                          <Field label='provide tags if you would like to'>
                            <Input type='text' name='tags' maxLength="32" value={this.state.tags} style={{width: '100%'}} onChange={this.handleChange} placeholder='type tags for selected file'/>
                          </Field>
                          <Button onClick={this.addFile} mr={3} icon="FileUpload" iconpos="right">Upload selected</Button>
                        </div>
                        :
                        <div>
                          <Field label='provide tags if you would like to'>
                            <Input disabled type='text' name='tags' maxLength="32" value={this.state.tags} style={{width: '100%'}} placeholder='type tags for selected file'/>
                          </Field>
                          <Button style={{marginBottom: '16px'}} disabled>
                            <Loader color="white" size="24px" bg="primary" />
                          </Button>
                        </div>
                      }
                    </div>) :
                    (<div style={{wordBreak: 'break-all', marginTop: '32px'}}>
                        <Table>
                        <tbody>
                          <tr>
                            <td style={{width: '30%'}}><b>File name:</b></td>
                            <td>{this.state.fileName}</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>IPFS address:</b></td>
                            <td><a href={this.buildIpfsUrl(this.state.addedFile.ipfs)} className="alert-link" target="_blank" rel="noopener noreferrer">
                             {this.state.addedFile.ipfs}</a> &nbsp; (click to visit)</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>File hash:</b></td>
                            <td>{this.state.addedFile.filehash}</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>File tags:</b></td>
                            <td>{this.state.addedFile.tags}</td>
                          </tr>
                          </tbody>
                        </Table>

                        <OutlineButton style={{marginTop: '16px'}} icon="AttachFile" iconpos="right" onClick={() => this.setState({fileName: ''})}>Add another file</OutlineButton>
                      </div>)
                  }
                </Card>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card width={'70%'} style={{minWidth: '420px'}} mx={'auto'} px={4}>
                  <Heading>Check File</Heading>
                  <Text mb={4}>
                    Paste the hash of file below to check whether this file is owned by someone, or select it from your device storage and we will compute its hash for you.
                    If the file is owned then you will see all the details.
                  </Text>
                  <OutlineButton icon="Compare" iconpos="right" onClick={this.handleClickCheck.bind(this)} mr={3} style={{width: '100%'}}>
                    Select file to check
                    <ReactDropzone multiple={false}
                      onDrop={(acceptedFiles, rejectedFiles) => this.fileSelectedToCheck(acceptedFiles, rejectedFiles)}
                      ref="dropzone2"
                      style={{display: 'none'}}
                      minSize={0}
                      maxSize={this.state.maxFileSize}>
                    </ReactDropzone>
                  </OutlineButton>
                  <div style={{height: '10px'}}></div>
                  <Field label='or paste hash of the file'>
                    <div style={{
                      display: 'inline-flex',
                      width: '100%'
                    }}>
                      <Input type='text' name='fileHashToCheck' minLength="66" maxLength="66" value={this.state.fileHashToCheck} style={{width: '100%'}} onChange={this.handleChange} placeholder='paste hash here'/>
                      {this.state.isSearchLoading === false ?
                        <Button onClick={this.getFile} id="searchbtn" icon="Search" iconpos="right">Search</Button>
                        :
                        <Button disabled>
                          <Loader color="white" size="24px" bg="primary" />
                        </Button>
                      }
                    </div>
                  </Field>
                  {this.state.checkedFile !== null &&
                    <Table>
                      <tbody>
                        <tr>
                          <td style={{width: '20%'}}><b>Date:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{moment.unix(this.state.checkedFile.dateAdded).format('DD-MM-YYYY HH:mm:ss')}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>IPFS:</b></td>
                          <td style={{wordBreak: 'break-word'}}><a href={this.state.ipfsUrl} className="alert-link" target="_blank" rel="noopener noreferrer">
                            {this.bytesToString(this.state.checkedFile.ipfsHash)}</a>
                            &nbsp;(click to visit)
                          </td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Owner:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.state.checkedFile.holder}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Hash:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.state.checkedFile.fileHash}</td>
                        </tr>
                        <tr>
                          <td style={{width: '20%'}}><b>Tags:</b></td>
                          <td style={{wordBreak: 'break-all'}}>{this.bytesToString(this.state.checkedFile.tags)}</td>
                        </tr>
                      </tbody>
                    </Table>
                    }
                </Card>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card width={'70%'} style={{minWidth: '420px'}} mx={'auto'} px={4}>
                  <Heading>Your Files</Heading>
                  <Text mb={4}>
                    Here you can check all your uploaded files. Click the button below to check them all!
                  </Text>
                  {this.state.isMyFilesLoading === false ?
                    <Button onClick={this.getMyFiles} icon="Folder" iconpos="right" style={{marginBottom: '16px'}}>
                      Show My Files
                    </Button> :
                    <Button style={{marginBottom: '16px'}} disabled>
                      <Loader color="white" size="24px" bg="primary" />
                    </Button>
                  }
                  {this.state.myFiles &&
                      <Table>
                        <tbody>
                          <tr>
                            <td style={{width: '30%'}}><b>Account:</b></td>
                            <td style={{wordBreak: 'break-all'}}>{this.state.accounts[0]}</td>
                          </tr>
                          <tr>
                            <td style={{width: '30%'}}><b>Files owned:</b></td>
                            <td>{this.state.numberOfMyFiles}</td>
                          </tr>
                        </tbody>
                      </Table>
                    }
                    {this.state.myFiles && this.state.myFiles.length > 0 &&
                      <Table style={{marginTop: '32px'}}>
                        <thead>
                        <tr>
                          <th style={{width: '10%'}}>#</th>
                          <th style={{width: '20%'}}>Date</th>
                          <th style={{width: '55%'}}>Hash</th>
                          <th style={{width: '15%'}}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.myFiles}
                        </tbody>
                      </Table>
                    }
                </Card>
              </Col>
            </Row>
          </Container>
          <ToastMessage.Provider ref={node => window.toastProvider = node} />
        </div>
      </Container>
    );
  }
}

export default App;
