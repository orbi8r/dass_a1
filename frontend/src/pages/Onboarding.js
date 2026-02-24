/*5*/
import React, {useState, useEffect, useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api';
import {AuthCtx} from '../ctx';

var INTERESTS = ['Technology','Music','Art','Sports','Literature','Gaming','Science','Dance','Drama','Photography','Coding','Robotics','Design','Business'];

function Onboarding(){
  var nav= useNavigate();
  var {setUser}= useContext(AuthCtx);
  var[interests,setInterests] = useState([]);
  var [orgs,setOrgs]= useState([]);
  var [followedClubs,setFollowed]= useState([]);

  useEffect(function(){
    api.get('/participant/organizers').then(function(r){setOrgs(r.data)});
  },[]);

   var toggleInterest=function(i){
    if(interests.indexOf(i)!==-1) setInterests(interests.filter(function(x){return x!==i}));
   else setInterests(interests.concat(i));
 };

  var toggleClub= function(id){
     if(followedClubs.some(function(c){return String(c)===String(id)})) setFollowed(followedClubs.filter(function(x){return String(x)!==String(id)}));
    else setFollowed(followedClubs.concat(id));
  };

  var save= async function(){
   var r= await api.post('/participant/onboarding',{interests:interests,followedClubs:followedClubs});
     setUser(r.data);
    nav('/dashboard');
  };

 return <div>
      <h1>Welcome! Set your preferences</h1><hr/>
    <h2>Areas of Interest (select multiple):</h2>
    {INTERESTS.map(function(i){
      return <label key={i} style={{display:'inline-block',marginRight:10}}>
        <input type="checkbox" checked={interests.indexOf(i)!==-1} onChange={function(){toggleInterest(i)}}/>{i}
      </label>;
    })}
    <hr/>
    <h2>Clubs/Organizers to Follow:</h2>
    {orgs.length===0  &&<p>No clubs yet.</p>}
   {orgs.map(function(o){
      return <label key={o._id} style={{display:'block'}}>
       <input type="checkbox"  checked={followedClubs.some(function(c){return String(c)===String(o._id)})} onChange={function(){toggleClub(o._id)}}/>{' '}
        {o.organizerName} ({o.category})
     </label>;
  })}
    <hr/>
    <button onClick={save}>Save & Continue</button>{' '}
  <button onClick={function(){nav('/dashboard')}}>Skip</button>
  </div>;
}

export default Onboarding;
