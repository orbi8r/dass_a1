/*10.2*/
import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';

function OrgDash(){
  var [events,setEvents] = useState([]);
  var [analytics,setAnalytics] = useState({});

  useEffect(function(){
    api.get('/organizer/events').then(function(r){setEvents(r.data)}).catch(function(){});
    api.get('/organizer/analytics').then(function(r){setAnalytics(r.data)}).catch(function(){});
  },[]);

  return <div>
    <h1>Organizer Dashboard</h1><hr/>
    <h2>Analytics (completed/ongoing events)</h2>
    <table><tbody>
      <tr><td>Total Events</td><td>{analytics.totalEvents||0}</td></tr>
      <tr><td>Total Registrations</td><td>{analytics.totalRegistrations||0}</td></tr>
      <tr><td>Total Revenue</td><td>Rs.{analytics.totalRevenue||0}</td></tr>
    </tbody></table>
    <hr/>
    <h2>My Events</h2>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {events.map(function(e){
        return <div key={e._id} className="card" style={{width:250}}>
          <b><Link to={'/org/event/'+e._id}>{e.name}</Link></b><br/>
          Type: {e.type}<br/>
          Status: {e.status}<br/>
          Registrations: {e.registrationCount}
        </div>;
      })}
    </div>
    {events.length===0 && <p>No events yet. <Link to="/org/create">Create one</Link></p>}
  </div>;
}

export default OrgDash;
