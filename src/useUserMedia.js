import { useEffect, useState } from 'react';

const useUserMedia = (constraints = { video: true, audio: true }) => {
  const [ stream, setStream ] = useState('');
  const [ error, setError ] = useState(null);

  useEffect(() => {
    if (stream) return;
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(stream);
      } catch (e) {
        setError(e);
      }
    }
    getUserMedia();
  });

  return {
    stream,
    error,
  };
}

export default useUserMedia;