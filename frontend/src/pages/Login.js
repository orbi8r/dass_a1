import React, {useState, useContext} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {AuthCtx} from '../ctx';
import api from '../api';

function Login(){
  var {login} = useContext(AuthCtx);
  var nav = useNavigate();
  var [email,setEmail] = useState('');
  var [password,setPassword] = useState('');
  var [err,setErr] = useState('');
  var [failCount,setFailCount] = useState(0);
  var [showForgot,setShowForgot] = useState(false);
  var [forgotEmail,setForgotEmail] = useState('');
  var [forgotReason,setForgotReason] = useState('');
  var [forgotMsg,setForgotMsg] = useState('');

  var submit = async function(e){
    e.preventDefault();
    setErr('');
    try {
      var u = await login(email,password);
      if(u.role==='participant') nav('/dashboard');
      else if(u.role==='organizer') nav('/org/dashboard');
      else if(u.role==='admin') nav('/admin/dashboard');
    } catch(ex){
      var newCount = failCount + 1;
      setFailCount(newCount);
      setErr(ex.response?.data?.msg || 'login failed');
      if(newCount >= 3 && !showForgot){
        setShowForgot(true);
        setForgotEmail(email);
      }
    }
  };

  var submitForgot = async function(){
    setForgotMsg('');
    try {
      var r = await api.post('/auth/forgot-password',{email:forgotEmail, reason:forgotReason||'Forgot password'});
      setForgotMsg(r.data.msg);
    } catch(ex){ setForgotMsg(ex.response?.data?.msg||'failed'); }
  };

  return <div>
    <h1>Login</h1><hr/>
    <form onSubmit={submit}>
      <label>Email: <input value={email} onChange={function(e){setEmail(e.target.value)}} size="30"/></label>
      <label>Password: <input type="password" value={password} onChange={function(e){setPassword(e.target.value)}} size="30"/></label>
      <br/><button type="submit">Login</button>
      {err && <span className="err"> {err}</span>}
      {failCount >= 3 && <p className="err">Multiple failed attempts. Consider resetting your password below.</p>}
    </form>
    <hr/>
    <p>No account? <Link to="/register">Register as Participant</Link></p>
    <p><a href="#" onClick={function(e){e.preventDefault();setShowForgot(!showForgot);if(!forgotEmail)setForgotEmail(email)}}>Forgot Password?</a></p>
    {showForgot && <div>
      <h3>Request Password Reset</h3>
      <p>Your request will be sent to the admin. The admin will set a new password and share it with you.</p>
      <label>Email: <input value={forgotEmail} onChange={function(e){setForgotEmail(e.target.value)}} size="30"/></label>
      <label>Reason: <input value={forgotReason} onChange={function(e){setForgotReason(e.target.value)}} size="40" placeholder="optional" onKeyDown={function(e){if(e.key==='Enter')submitForgot()}}/></label>
      <br/><button onClick={submitForgot}>Request Reset</button>
      {forgotMsg && <p><b>{forgotMsg}</b></p>}
    </div>}
  </div>;
}

export default Login;
