/*10.2*/
import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';

function OrgOngoing(){
  var [events,setEvents]= useState([]);

  useEffect(function(){
    api.get('/organizer/events').then(function(r){
       setEvents(r.data.filter(function(e){ return e.status==='ongoing'||e.status==='published'; }));
    }).catch(function(){});
  },[]);

 return <div>
   <h1>Ongoing Events</h1><hr/>
    <table>
     <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Registrations</th></tr></thead>
      <tbody>
        {events.map(function(e){
         return <tr key={e._id}>
            <td><Link to={'/org/event/'+e._id}>{e.name}</Link></td>
            <td>{e.type}</td>
           <td>{e.status}</td>
            <td>{e.registrationCount}</td>
        </tr>;
        })}
       </tbody>
    </table>
   {events.length===0 && <p>No ongoing events.</p>}
  </div>;
}

export default OrgOngoing;
