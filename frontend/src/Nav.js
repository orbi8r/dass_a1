/*9.1*/
import React, {useContext} from 'react';
import {Link}from 'react-router-dom';
import {AuthCtx} from './ctx';

function Nav(){
  var {user,logout}= useContext(AuthCtx);
  if(!user) return null;

  var links= [];
  if(user.role==='participant'){
    links = [
      {to:'/dashboard', label:'Dashboard'},
      {to:'/events', label:'Browse Events'},
    {to:'/clubs', label:'Clubs/Organizers'},
     {to:'/profile', label:'Profile'}
     ];
  } else if(user.role==='organizer'){
    links = [
      {to:'/org/dashboard', label:'Dashboard'},
     {to:'/org/create', label:'Create Event'},
    {to:'/org/profile', label:'Profile'},
     {to:'/org/ongoing', label:'Ongoing Events'}
    ];
  }else if(user.role==='admin'){
    links = [
      {to:'/admin/dashboard', label:'Dashboard'},
      {to:'/admin/organizers', label:'Manage Clubs/Organizers'},
      {to:'/admin/resets', label:'Password Reset Requests'}
    ];
  }

  return <div className="nav">
    <b>Felicity</b>{' | '}
    {links.map(function(l){ return <Link key={l.to}to={l.to}>{l.label}</Link>; })}
    <a href="#" onClick={function(e){e.preventDefault();logout();window.location='/login';}}>Logout</a>
    {' '}
   <span style={{float:'right',fontSize:11}}>({user.email} - {user.role})</span>
  </div>;
}

export default Nav;
