/*9.6*/
import React, {useState, useContext, useEffect} from 'react';
import api from '../api';
import {AuthCtx} from '../ctx';

var INTERESTS = ['Technology','Music','Art','Sports','Literature','Gaming','Science','Dance','Drama','Photography','Coding','Robotics','Design','Business'];

function Profile(){
  var {user,setUser} = useContext(AuthCtx);
  var [f,setF] = useState({});
  var [msg,setMsg] = useState('');
  var [orgs,setOrgs] = useState([]);
  var [pwdCur,setPwdCur] = useState('');
  var [pwdNew,setPwdNew] = useState('');

  useEffect(function(){
    if(user){
      setF({firstName:user.firstName||'',lastName:user.lastName||'',contactNumber:user.contactNumber||'',
        college:user.college||'',interests:user.interests||[],followedClubs:user.followedClubs||[]});
    }
    api.get('/participant/organizers').then(function(r){setOrgs(r.data)});
  },[user]);

  var set = function(k,v){ setF(Object.assign({},f,{[k]:v})); };

  var save = async function(){
    var r = await api.put('/participant/profile', f);
    setUser(r.data); setMsg('saved');
  };

  var toggleInterest = function(i){
    var arr = f.interests.slice();
    var idx = arr.indexOf(i);
    if(idx!==-1) arr.splice(idx,1); else arr.push(i);
    set('interests', arr);
  };

  var toggleClub = function(id){
    var arr = (f.followedClubs||[]).map(function(c){return String(c)});
    var idx = arr.indexOf(String(id));
    if(idx!==-1) arr.splice(idx,1); else arr.push(String(id));
    set('followedClubs', arr);
  };

  var changePwd = async function(){
    try {
      await api.put('/participant/password', {currentPassword:pwdCur, newPassword:pwdNew});
      setMsg('password changed');
      setPwdCur(''); setPwdNew('');
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  if(!user) return null;

  return <div>
    <h1>Profile</h1><hr/>
    {msg && <p className="ok">{msg}</p>}
    <label>Email: <b>{user.email}</b> (non-editable)</label>
    <label>Participant Type: <b>{user.participantType}</b> (non-editable)</label>
    <label>First Name: <input value={f.firstName||''} onChange={function(e){set('firstName',e.target.value)}}/></label>
    <label>Last Name: <input value={f.lastName||''} onChange={function(e){set('lastName',e.target.value)}}/></label>
    <label>Contact Number: <input value={f.contactNumber||''} onChange={function(e){set('contactNumber',e.target.value)}}/></label>
    <label>College/Org: <input value={f.college||''} onChange={function(e){set('college',e.target.value)}}/></label>
    <hr/>
    <h2>Interests:</h2>
    {INTERESTS.map(function(i){
      return <label key={i} style={{display:'inline-block',marginRight:8}}>
        <input type="checkbox" checked={(f.interests||[]).indexOf(i)!==-1} onChange={function(){toggleInterest(i)}}/> {i}
      </label>;
    })}
    <hr/>
    <h2>Followed Clubs:</h2>
    {orgs.map(function(o){
      return <label key={o._id} style={{display:'block'}}>
        <input type="checkbox" checked={(f.followedClubs||[]).some(function(c){return String(c)===String(o._id)})} onChange={function(){toggleClub(o._id)}}/>{' '}
        {o.organizerName}
      </label>;
    })}
    <hr/>
    <button onClick={save}>Save Profile</button>
    <hr/>
    <h2>Change Password</h2>
    <label>Current: <input type="password" value={pwdCur} onChange={function(e){setPwdCur(e.target.value)}}/></label>
    <label>New: <input type="password" value={pwdNew} onChange={function(e){setPwdNew(e.target.value)}}/></label>
    <button onClick={changePwd}>Change Password</button>
  </div>;
}

export default Profile;
