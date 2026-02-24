/*9.2*/
import React, {useState, useEffect, useContext} from'react';
import {Link} from 'react-router-dom';
import api from '../api';
import  {AuthCtx} from '../ctx';

function Dashboard(){
 var {user}= useContext(AuthCtx);
  var [regs,setRegs] = useState([]);
  var [tab,setTab]= useState('normal');

  useEffect(function(){
    api.get('/participant/registrations').then(function(r){setRegs(r.data)});
  },[]);

  var normal= regs.filter(function(r){ return r.eventId && r.eventId.type==='normal'  && r.status!=='cancelled' && r.status!=='rejected'; });
  var merch =regs.filter(function(r){ return r.eventId&& r.eventId.type==='merchandise'; });
  var completed=  regs.filter(function(r){ return r.eventId && (r.eventId.status==='completed'||r.eventId.status==='closed');});
  var cancelled = regs.filter(function(r){  return r.status==='cancelled'||r.status==='rejected'; });

  var tabs= {normal:normal, merchandise:merch, completed:completed, 'cancelled/rejected':cancelled};

  return <div>
    <h1>My Events Dashboard</h1>
    <p>Welcome, {user?.firstName}</p><hr/>
   <div className="tabs">
       {Object.keys(tabs).map(function(t){
        return <span key={t} className={tab===t?'active':''} onClick={function(){setTab(t)}}>{t} ({tabs[t].length})</span>;
      })}
    </div>
    <br/>
   <table>
     <thead><tr><th>Event</th><th>Type</th><th>Organizer</th><th>Status</th><th>Team</th><th>Ticket</th></tr></thead>
       <tbody>
          {tabs[tab].map(function(r){
           var e= r.eventId;
           if(!e) return null;
         return <tr key={r._id}>
           <td><Link to={'/events/'+e._id}>{e.name}</Link></td>
             <td>{e.type}</td>
           <td>{e.organizerId?.organizerName || '-'}</td>
           <td>{r.status}{r.paymentStatus!=='none'?' (pay:'+r.paymentStatus+')':''}</td>
          <td>{r.teamId?.name||'-'}</td>
             <td>{r.ticketId ? <Link to={'/ticket/'+r.ticketId}>{r.ticketId}</Link> : '-'}</td>
         </tr>;
        })}
      </tbody>
    </table>
     {tabs[tab].length===0 && <p>Nothing here.</p>}
  </div>;
}

export default Dashboard;
