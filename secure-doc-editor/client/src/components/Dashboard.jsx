import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [docId, setDocId] = useState('');
    const [title, setTitle] = useState('');
    const [collabId, setCollabId] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const createDocument = async () => {
        const res = await fetch(`${window.location.origin.replace('3000', '3001')}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ title, encryptedContent: '' }),
        });
        const data = await res.json();
        if (data.document?.id) {
        localStorage.setItem('documentId', data.document.id);
        navigate('/editor');
        }
    };

    const openDocument = () => {
        localStorage.setItem('documentId', docId);
        navigate('/editor');
    };

    const addCollaborator = async () => {
        await fetch(`${window.location.origin.replace('3000', '3001')}/api/documents/${docId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ collaboratorId: collabId, permissions: ['write'] }),
        });
        alert('Collaborator added.');
    };

    return (
        <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
        <h2>Document Dashboard</h2>
        <div>
            <h3>Create Document</h3>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button onClick={createDocument}>Create</button>
        </div>
        <div>
            <h3>Open Document</h3>
            <input placeholder="Document ID" value={docId} onChange={(e) => setDocId(e.target.value)} />
            <button onClick={openDocument}>Open</button>
        </div>
        <div>
            <h3>Add Collaborator</h3>
            <input placeholder="Collaborator User ID" value={collabId} onChange={(e) => setCollabId(e.target.value)} />
            <button onClick={addCollaborator}>Add</button>
        </div>
        </div>
    );
};

export default Dashboard;
