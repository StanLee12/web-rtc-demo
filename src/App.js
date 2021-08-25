import { useState } from 'react';
import { Button, Space, Input, Card, Typography, } from 'antd';
import './App.css';

let peer;
let sdp;
let dc;
let rdc;
let text;

function App() {

  const createConnection = () => {
    peer = new RTCPeerConnection();
    peer.onicecandidate = (e) => {
      const SDP = JSON.stringify(peer.localDescription);
      console.log('New Ice Candidate!!!', JSON.stringify(peer.localDescription));
      console.log('PEER====', peer);
      setContent(SDP);
    }
    peer.ondatachannel = (e) => {
      rdc = e.channel;
      rdc.onmessage = (e) => {
        console.log('RDC New message', e.data);
        const _message = message + "\n" + e.data;
        setMessage(_message);
      }
      rdc.onopen = (e) => { console.log('RDC opened!!!') }
    };
  }

  const [ message, setMessage ] = useState('');

  const createChannel = () => {
    dc = peer.createDataChannel('channel');
    dc.onmessage = (e) => {
      const _message = message + "\n" + e.data;
      setMessage(_message);
    };
    dc.onopen = (e) => console.log('Connection opened!!!');
  }

  const createOffer = () => {
    peer.createOffer().then((o) => { peer.setLocalDescription(o).then(() => {
      console.log('created offer!!!');
      console.log('peer=====', peer);
    })});
  }

  const createAnswer = () => {
    peer.createAnswer().then((a) => { peer.setLocalDescription(a).then(() => console.log('created answer!!')) });
  }

  const setRemoteDescription = () => {
    if (!sdp) {
      return;
    }
    if (!peer) {
      console.log('peer ====', peer);
      return;
    }
    console.log('sdp=====', sdp);
    peer.setRemoteDescription(JSON.parse(sdp)).then(() => console.log('set remote successfully!!!'));
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

  return (
    <div className="App">
      <header className="App-header">
        <Space
          align="center"
          direction="vertical"
          size="large"
        >
          <Space
            align="center"
            direction="vertical"
          >
            <Card
              title="SDP"
            >
              <Typography.Paragraph
                copyable
                type="success"
              >
                {content}
              </Typography.Paragraph>
            </Card>
            <Card
              title="DATA-CHANNEL"
            >
              <Typography.Paragraph
                copyable
                type="success"
              >
                {message}
              </Typography.Paragraph>
            </Card>
          </Space>
          <Button
            type="primary"
            onClick={createConnection}
          >Create Connection</Button>
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
