import { useState, useEffect, useRef } from 'react';
import { Button, Space, Input, Card, Typography, } from 'antd';
import './App.css';
import useUserMedia from './useUserMedia';

let connection;
let sdp;
let dc;
let rdc;
let text;

function App() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const { stream, error } = useUserMedia();

  useEffect(() => {
    createConnection();
  }, []);

  useEffect(() => {
    if (stream) {
      localVideo.current.srcObject = stream;
      remoteVideo.current.srcObject = stream;
    }
  }, [stream]);

  const createConnection = () => {
    console.log('Create connection');
    connection = new RTCPeerConnection();
    connection.onicecandidate = (e) => {
      const SDP = JSON.stringify(connection.localDescription);
      console.log('New Ice Candidate!!!', JSON.stringify(connection.localDescription));
      setContent(SDP);
    }
    connection.ondatachannel = (e) => {
      rdc = e.channel;
      rdc.onmessage = (e) => {
        const _message = message + "\n" + e.data;
        setMessage(_message);
      }
      rdc.onopen = (e) => { console.log('RDC opened!!!') }
    };
  }

  const [ message, setMessage ] = useState('');

  const createChannel = () => {
    dc = connection.createDataChannel('channel');
    dc.onmessage = (e) => {
      const _message = message + "\n" + e.data;
      setMessage(_message);
    };
    dc.onopen = (e) => console.log('Connection opened!!!');
  }

  const createOffer = () => {
    connection.createOffer().then((o) => { connection.setLocalDescription(o).then(() => {
      console.log('created offer!!!');
    })});
  }

  const createAnswer = () => {
    connection.createAnswer().then((a) => { connection.setLocalDescription(a).then(() => console.log('created answer!!')) });
  }

  const setRemoteDescription = () => {
    if (!sdp) {
      return;
    }
    connection.setRemoteDescription(JSON.parse(sdp)).then(() => console.log('set remote successfully!!!'));
  }

  const [ content, setContent ] = useState(null);

  const onSend = () => {
    dc?.send(text);
    rdc?.send(text);
  }

  const setSDP = (e) => {
    sdp = e.target.value;
  }

  const setText = (e) => {
    text = e.target.value;
  }

  if (error) {
    return <Button>Permission</Button>
  }

  return (
    <div className="App">
      <header className="App-header">
        <Space
          align="center"
          direction="vertical"
          size="small"
        >
          <Space
            align="center"
            direction="vertical"
          >
            <Card
              title="SDP"
            >
              <Typography.Paragraph
                ellipsis
                copyable
                style={{ width: '200px', }}
                type="success"
              >
                {content}
              </Typography.Paragraph>
            </Card>
            <Space
              align="center"
              direction="horizontal"
            >
              <video
                width={200}
                height={200}
                autoPlay
                ref={localVideo}
              />
              <video
                width={200}
                height={200}
                autoPlay
                ref={remoteVideo}
              />
            </Space>
          </Space>
          <Button
            type="primary"
            onClick={createChannel}
          >Create Channel</Button>
          <Button
            type="primary"
            onClick={createOffer}
          >Create Offer</Button>
          <Button
            type="primary"
            onClick={createAnswer}
          >Create Answer</Button>
          <Space
            align="center"
            direction="horizontal"
            size="middle"
          >
            <Input.TextArea
              onChange={setSDP}
            ></Input.TextArea>
            <Button type="primary" onClick={setRemoteDescription}>Set RemoteDescription</Button>
          </Space>
          <Space
            align="center"
            direction="horizontal"
            size="middle"
          >
            <Input
              onChange={setText}
            ></Input>
            <Button type="primary" onClick={onSend} >Send</Button>
          </Space>
        </Space>
      </header>
    </div>
  );
}

export default App;
