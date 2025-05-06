import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isNewUser ? '/api/auth/register' : '/api/auth/login';
        const payload = isNewUser ? { username, password, email } : { username, password };
        const res = await fetch(`${window.location.origin.replace('3000', '3001')}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            navigate('/dashboard');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ color: '#333' }}>{isNewUser ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {isNewUser && (
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <button type="submit">Submit</button>
            <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setIsNewUser(!isNewUser)}>
            {isNewUser ? 'Already have an account?' : 'Create new account'}
            </p>
        </form>
        </div>
    );
};

export default Login;
