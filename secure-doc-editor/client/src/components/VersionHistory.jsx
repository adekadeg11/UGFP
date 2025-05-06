import React from 'react';

const VersionHistory = ({ versions, onRestore }) => {
    return (
        <div style={{ borderLeft: '1px solid #ccc', paddingLeft: '1rem' }}>
        <h4>Version History</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {versions.map((v, i) => (
            <li key={v.id} style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => onRestore(v.ipfsCid)} style={{ fontSize: '0.9rem' }}>
                {v.message || `Version ${i + 1}`}<br/>
                <small>{new Date(v.timestamp).toLocaleString()}</small>
                </button>
            </li>
            ))}
        </ul>
        </div>
    );
};

export default VersionHistory;
