/*4.1.1*/
import React, {useState, useContext} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import api from '../api';
import {AuthCtx} from '../ctx';

function Register(){
  var nav = useNavigate();
  var {setUser} = useContext(AuthCtx);
  var [f,setF] = useState({firstName:'',lastName:'',email:'',password:'',participantType:'iiit',college:'',contactNumber:''});
  var [err,setErr] = useState('');

  var set = function(k,v){ setF(Object.assign({},f,{[k]:v})); };

  var submit = async function(e){
    e.preventDefault();
    setErr('');
    try {
      var r = await api.post('/auth/register',f);
      localStorage.setItem('token',r.data.token);
      setUser(r.data.user);
      if(r.data.needsOnboarding) nav('/onboarding');
      else nav('/dashboard');
    } catch(ex){
      setErr(ex.response?.data?.msg || 'registration failed');
    }
  };

  return <div>
    <h1>Register</h1><hr/>
    <form onSubmit={submit}>
      <label>Type: <select value={f.participantType} onChange={function(e){set('participantType',e.target.value)}}>
        <option value="iiit">IIIT Student</option>
        <option value="non-iiit">Non-IIIT Participant</option>
      </select></label>
      <label>First Name: <input value={f.firstName} onChange={function(e){set('firstName',e.target.value)}}/></label>
      <label>Last Name: <input value={f.lastName} onChange={function(e){set('lastName',e.target.value)}}/></label>
      <label>Email: <input type="email" value={f.email} onChange={function(e){set('email',e.target.value)}} size="30"/></label>
      {f.participantType==='iiit' && <small>(must be @iiit.ac.in / @students.iiit.ac.in / @research.iiit.ac.in)</small>}
      <label>Password: <input type="password" value={f.password} onChange={function(e){set('password',e.target.value)}}/></label>
      <label>College/Org: <input value={f.college} onChange={function(e){set('college',e.target.value)}}/></label>
      <label>Contact Number: <input value={f.contactNumber} onChange={function(e){set('contactNumber',e.target.value)}}/></label>
      <br/><button type="submit">Register</button>
      {err && <span className="err"> {err}</span>}
    </form>
    <hr/>
    <p>Already have an account? <Link to="/login">Login</Link></p>
  </div>;
}

export default Register;
