import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import CryptoJS from 'crypto-js';
import { uploadToIPFS, downloadFromIPFS } from '../utils/storage';
import VersionHistory from './VersionHistory';

Quill.register('modules/cursors', QuillCursors);

const DocumentEditor = () => {
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [progress, setProgress] = useState(0);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId');
  const getEncryptionKey = useCallback(() => {
    return `${userId}-${process.env.REACT_APP_ENCRYPTION_SECRET || 'fallback-secret'}`;
  }, [userId]);

  const token = localStorage.getItem('token');
  const docId = localStorage.getItem('documentId');

  useEffect(() => {
    if (editorRef.current && !quill) {
      const q = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          cursors: {
            transformOnTextChange: true,
            hideDelayMs: 3000,
            hideSpeedMs: 300,
          },
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['image', 'code-block'],
          ],
        },
      });
      setQuill(q);
    }
  }, [editorRef, quill]);

  useEffect(() => {
    if (!quill || !docId || !token) return;

    socketRef.current = io(window.location.origin.replace('3000', '3001'), {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect_error', (err) => {
      setError('Connection error: ' + err.message);
    });

    socketRef.current.emit('joinDocument', { documentId: docId });

    socketRef.current.on('documentData', async (data) => {
      try {
        setVersions(data.versions || []);
        if (data.encryptedContent) {
          const encryptedText = await downloadFromIPFS(data.encryptedContent, setProgress);
          const decrypted = CryptoJS.AES.decrypt(encryptedText, getEncryptionKey()).toString(CryptoJS.enc.Utf8);
          quill.setContents(JSON.parse(decrypted));
        }
      } catch (err) {
        setError('Failed to load document: ' + err.message);
      }
    });

    socketRef.current.on('versionSaved', ({ version }) => {
      setVersions(prev => [...prev, version]);
    });

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        socketRef.current.emit('textChange', { documentId: docId, delta });
      }
    });

    socketRef.current.on('textChange', ({ delta, userId: changeUserId }) => {
      if (changeUserId !== userId) {
        quill.updateContents(delta);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [quill, docId, token, userId, getEncryptionKey]);

  const saveVersion = async () => {
    try {
      setError(null);
      const content = JSON.stringify(quill.getContents());
      const encrypted = CryptoJS.AES.encrypt(content, getEncryptionKey()).toString();
      const cid = await uploadToIPFS(encrypted, setProgress);

      socketRef.current.emit('saveVersion', {
        documentId: docId,
        encryptedContent: cid,
        message: `Manual save at ${new Date().toLocaleTimeString()}`,
      });
    } catch (err) {
      setError('Failed to save version: ' + err.message);
    }
  };

  const handleRestore = async (cid) => {
    try {
      setError(null);
      const encrypted = await downloadFromIPFS(cid, setProgress);
      const decrypted = CryptoJS.AES.decrypt(encrypted, getEncryptionKey()).toString(CryptoJS.enc.Utf8);
      quill.setContents(JSON.parse(decrypted));
    } catch (err) {
      setError('Failed to restore version: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', maxWidth: '1000px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ flex: 3 }}>
        <h2>Secure Document Editor</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {progress > 0 && progress < 100 && (
          <p style={{ color: '#888' }}>Progress: {progress}%</p>
        )}
        <div ref={editorRef} style={{ height: '400px', background: '#fff', border: '1px solid #ccc' }}></div>
        <button onClick={saveVersion} style={{ marginTop: '10px' }}>Save to IPFS</button>
      </div>
      <div style={{ flex: 1, marginLeft: '1rem' }}>
        <VersionHistory versions={versions} onRestore={handleRestore} />
      </div>
    </div>
  );
};

export default DocumentEditor;