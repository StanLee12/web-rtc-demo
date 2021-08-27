import { useState, useEffect, useRef } from 'react';
import { Button, Space, Input, Card, Typography, Result } from 'antd';
import './App.css';
import useUserMedia from './useUserMedia';

let connection;
let sdp;
let dc;
let rdc;
let text;

const log = (message, ...params) => {
  console.log(message, params?.join());
}

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
    log('Create connection');
    connection = new RTCPeerConnection({});
    connection.onicecandidate = (e) => {
      const _candidate = e.candidate;
      log('New Ice Candidate!!!', JSON.stringify(e));
      if (_candidate) {
        addCandidate(_candidate);
        setCandidateContent(JSON.stringify(_candidate));
      }
      setContent(JSON.stringify(connection.localDescription));
    }
    connection.ondatachannel = (e) => {
      rdc = e.channel;
      rdc.onmessage = (e) => {
        const { data } = e;
        log('RDC received message', data);
        const _message = message + "\n" + data;
        setMessage(_message);
      }
      rdc.onopen = (e) => { log('RDC opened!!!') }
    };
    connection.oniceconnectionstatechange = (e) => {
      log('ICE connection state change', JSON.stringify(e), connection.iceConnectionState);
    }
    connection.ontrack = (e) => {
      log('on track!!!');
      remoteVideo.current.srcObject = e.streams[0];
    }
    connection.onicecandidateerror = (e) => {
      log("onicecandidateerror ==== ", JSON.stringify(e));
    }
  }

  const addTrack = () => {
    connection || createConnection();
    if (stream) {
      for (const track of stream.getTracks()) {
        log('add track!');
        connection.addTrack(track, stream);
      }
    }
  }

  const createChannel = () => {
    connection || createConnection();
    log('Create data channel');
    dc = connection.createDataChannel('channel');
    dc.onmessage = (e) => {
      const { data } = e;
      log('DC received message', data);
      const _message = message + "\n" + data;
      setMessage(_message);
    };
    dc.onopen = (e) => log('Connection opened!!!');
  }

  const createOffer = async () => {
      connection || createConnection();
      try {
        log('Create OFFER!');
        const offer = await connection.createOffer({
          offerToReceiveVideo: 1,
        });
        log('Create OFFER sucessfully!!!');
        await connection.setLocalDescription(offer);
        log('Set SDP sucessfully!!!');
      } catch (error) {
        log(error);
      }
      // connection.createOffer({
      //   offerToReceiveAudio: 0,
      //   offerToReceiveVideo: 1
      // }).then((o) => { return connection.setLocalDescription(o).then(() => {
      //     log('created offer!!!');
      // })});
    }

  const createAnswer = async () => {
    connection || createConnection();
    try {
      log('Create ANSWER!');
      const answer = await connection.createAnswer();
      log('Create ANSWER sucessfully!!!');
      await connection.setLocalDescription(answer);
      log('Set SDP Sucessfully!!!');
    } catch (error) {
      log(error);
    }
    // connection.createAnswer().then((a) => { return connection.setLocalDescription(a).then(() => {
    //   log('created answer!!')
    // }) });
  }

  const setRemoteDescription = () => {
    if (!sdp) {
      return;
    }
    connection.setRemoteDescription(JSON.parse(sdp)).then(() => log('set remote successfully!!!'));
  }

  const addCandidate = async (candidate) => {
    try {
      await connection.addIceCandidate(candidate);
      log('Add candidate successfully!!!');
    } catch (error) {
      log(error);
    }
  }

  const onSend = () => {
    dc?.send(text);
    rdc?.send(text);
  }

  const onInputSDPChange = (e) => {
    sdp = e.target.value;
  }

  const setText = (e) => {
    text = e.target.value;
  }

  const onClose = () => {
    connection?.close();
    connection = null;
  }

  if (error) {
    return (
      <Result
        status="warning"
        title="No camera permission,Please check"
      />
    );
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
          <Button type="primary" onClick={addTrack}>Add Stream</Button>
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
            <Input
              onChange={setText}
            ></Input>
            <Button type="primary" onClick={onSend}>Send</Button>
          </Space>
          <Button type="primary" danger onClick={onClose}>Close</Button>
        </Space>
      </header>
    </div>
  );
}

export default App;
