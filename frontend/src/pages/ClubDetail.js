/*9.8*/
import React, {useState, useEffect} from 'react';
import {useParams, Link} from 'react-router-dom';
import api from '../api';

function ClubDetail(){
  var {id} = useParams();
  var [data,setData] = useState(null);

  useEffect(function(){
    api.get('/participant/organizers/'+id).then(function(r){setData(r.data)}).catch(function(){});
  },[id]);

  if(!data) return <p>loading...</p>;
  var org = data.organizer;
  var now = new Date();
  var upcoming = data.events.filter(function(e){return new Date(e.startDate||'2099-01-01')>=now});
  var past = data.events.filter(function(e){return new Date(e.startDate||'2099-01-01')<now});

  return <div>
    <h1>{org.organizerName}</h1>
    <p>Category: {org.category}</p>
    <p>{org.description}</p>
    <p>Contact: {org.contactEmail}</p>
    <hr/>
    <h2>Upcoming Events</h2>
    {upcoming.length===0 && <p>None</p>}
    <ul>{upcoming.map(function(e){return <li key={e._id}><Link to={'/events/'+e._id}>{e.name}</Link> ({e.type}) - {new Date(e.startDate).toLocaleDateString()}</li>})}</ul>
    <h2>Past Events</h2>
    {past.length===0 && <p>None</p>}
    <ul>{past.map(function(e){return <li key={e._id}><Link to={'/events/'+e._id}>{e.name}</Link> ({e.type})</li>})}</ul>
  </div>;
}

export default ClubDetail;
