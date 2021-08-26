import { useState, useEffect, useRef } from 'react';
import { Button, Space, Input, Card, Typography, } from 'antd';
import './App.css';
import useUserMedia from './useUserMedia';

let connection;
let sdp;
let dc;
let rdc;
let text;
let candidate;

function App() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [ sdpContent, setContent ] = useState('');
  const [ candidateContent, setCandidateContent ] = useState('');
  const [ message, setMessage ] = useState('');
  const { stream, error } = useUserMedia();

  useEffect(() => {
    createConnection();
  }, []);

  useEffect(() => {
    if (stream) {
      localVideo.current.srcObject = stream;
    }
  }, [stream]);

  const createConnection = () => {
    console.log('Create connection');
    connection = new RTCPeerConnection();
    connection.onicecandidate = (e) => {
      const _candidate = e.candidate;
      console.log('New Ice Candidate!!!', JSON.stringify(e));
      setCandidateContent(JSON.stringify(_candidate));
      setContent(JSON.stringify(connection.localDescription));
    }
    connection.ondatachannel = (e) => {
      rdc = e.channel;
      rdc.onmessage = (e) => {
        const { data } = e;
        console.log('RDC received message', data);
        const _message = message + "\n" + data;
        setMessage(_message);
      }
      rdc.onopen = (e) => { console.log('RDC opened!!!') }
    };
    connection.oniceconnectionstatechange = (e) => {
      console.log('ICE connection state change', JSON.stringify(e), connection.iceConnectionState);
    }
    connection.ontrack = (e) => {
      console.log('接收到stream!!!');
      remoteVideo.current.srcObject = e.streams[0];
    }
  }

  const addTrack = () => {
    if (stream) {
      for (const track of stream.getTracks()) {
        console.log('add track!');
        connection.addTrack(track, stream);
      }
    }
  }

  const createChannel = () => {
    dc = connection.createDataChannel('channel');
    dc.onmessage = (e) => {
      const { data } = e;
      console.log('DC received message', data);
      const _message = message + "\n" + data;
      setMessage(_message);
    };
    dc.onopen = (e) => console.log('Connection opened!!!');
  }

  const createOffer = () => {
    connection.createOffer({
      offerToReceiveAudio: 0,
      offerToReceiveVideo: 1
    }).then((o) => { connection.setLocalDescription(o).then(() => {
        console.log('created offer!!!');
      })});
    }

  const createAnswer = () => {
    connection.createAnswer().then((a) => { connection.setLocalDescription(a).then(() => {
      console.log('created answer!!')
    }) });
  }

  const setRemoteDescription = () => {
    if (!sdp) {
      return;
    }
    connection.setRemoteDescription(JSON.parse(sdp)).then(() => console.log('set remote successfully!!!'));
  }

  const addCandidate = () => {
    connection.addIceCandidate(candidate || {}).then(() => console.log('add candidate successfully!!!'));
  }

  const onInputCandidateChange = (e) => {
    candidate = e.target.value;
  }

  const onSend = () => {
    if (stream) {
      dc?.send(stream);
      rdc?.send(stream);
    }
    dc?.send(text);
    rdc?.send(text);
  }

  const onInputSDPChange = (e) => {
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
            <Space
              align="center"
              direction="horizontal"
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
                  {sdpContent}
                </Typography.Paragraph>
              </Card>
              <Card
                title="CANDIDATE"
              >
                <Typography.Paragraph
                  ellipsis
                  copyable
                  style={{ width: '200px', }}
                  type="success"
                >
                  {candidateContent}
                </Typography.Paragraph>
              </Card>
            </Space>
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
              onChange={onInputSDPChange}
            ></Input.TextArea>
            <Button type="primary" onClick={setRemoteDescription}>Set SDP</Button>
          </Space>
          <Space
            align="center"
            direction="horizontal"
            size="middle"
          >
            <Input.TextArea
              onChange={onInputCandidateChange}
            ></Input.TextArea>
            <Button type="primary" onClick={addCandidate}>Set CANDIDATE</Button>
          </Space>
          <Space
            align="center"
            direction="horizontal"
            size="middle"
          >
            <Input
              onChange={setText}
            ></Input>
            <Button type="primary" onClick={onSend}>Send</Button>
          </Space>
          <Button type="primary" onClick={addTrack}>Start Stream</Button>
        </Space>
      </header>
    </div>
  );
}

export default App;
