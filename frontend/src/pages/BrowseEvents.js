/*9.3*/
import React, {useState, useEffect, useContext} from 'react';
import {Link} from  'react-router-dom';
import api from '../api';
import {AuthCtx} from '../ctx';

function BrowseEvents(){
  var{user}=useContext(AuthCtx);
 var [events,setEvents] = useState([]);
  var [trending,setTrending]= useState([]);
 var [search,setSearch] = useState('');
  var [type,setType]= useState('');
  var [elig,setElig] = useState('');
  var [dateFrom,setDateFrom]= useState('');
  var[dateTo,setDateTo] = useState('');
   var[showFollowed,setShowFollowed]= useState(false);
  var[category,setCategory] = useState('');

  var load=function(){
    var params=  {};
    if(search) params.search = search;
   if(type)params.type = type;
    if(elig) params.eligibility = elig;
   if(dateFrom) params.dateFrom = dateFrom;
    if(dateTo) params.dateTo = dateTo;
    if(category) params.category= category;
   if(showFollowed &&user && user.followedClubs && user.followedClubs.length){
    params.followed = user.followedClubs.map(function(c){return String(c)}).join(',');
    }
   if(showFollowed && (!user || !user.followedClubs || !user.followedClubs.length)){
     setEvents([]);
     return;
   }
    api.get('/events',{params:params}).then(function(r){setEvents(r.data)});
  };

  useEffect(function(){
    load();
    api.get('/events/trending').then(function(r){setTrending(r.data)}).catch(function(){});
   },[]);

  /*5*/
  var sorted = events.slice().sort(function(a,b){
    if(!user || !user.interests  || !user.interests.length) return 0;
    var aMatch = (a.tags||[]).filter(function(t){ return user.interests.indexOf(t)!==-1; }).length;
   var bMatch = (b.tags||[]).filter(function(t){ return user.interests.indexOf(t)!==-1; }).length;
    return bMatch - aMatch;
  });

  return <div>
   <h1>Browse Events</h1><hr/>
    <div onKeyDown={function(e){if(e.key==='Enter')load()}}>
      Search: <input value={search} onChange={function(e){setSearch(e.target.value)}} size="25"/>
      {' '}Type: <select value={type} onChange={function(e){setType(e.target.value)}}>
        <option value="">All</option><option value="normal">Normal</option><option value="merchandise">Merchandise</option>
       </select>
       {' '}Eligibility: <select value={elig}onChange={function(e){setElig(e.target.value)}}>
        <option value="">All</option><option value="iiit">IIIT Only</option><option value="non-iiit">Non-IIIT</option>
      </select>
      {' '}From: <input type="date" value={dateFrom} onChange={function(e){setDateFrom(e.target.value)}}/>
       {' '}To: <input type="date" value={dateTo} onChange={function(e){setDateTo(e.target.value)}}/>
      {' '}Category: <input value={category} onChange={function(e){setCategory(e.target.value)}}size="12" placeholder="e.g. Tech"/>
      {' '}<label><input type="checkbox" checked={showFollowed} onChange={function(e){setShowFollowed(e.target.checked)}}/> Followed Clubs</label>
      {' '}<button onClick={load}>Search</button>
    </div>
    <hr/>

    {trending.length>0 &&<div>
      <h2>Trending (Top 5 in 24h)</h2>
      <ul>
        {trending.map(function(e){return <li key={e._id}><Link to={'/events/'+e._id}>{e.name}</Link> - {e.type}</li>; })}
       </ul>
      <hr/>
    </div>}

   <h2>All Events ({sorted.length})</h2>
     <table>
      <thead><tr><th>Name</th><th>Type</th><th>Organizer</th><th>Dates</th><th>Eligibility</th><th>Fee</th></tr></thead>
      <tbody>
        {sorted.map(function(e){
         return <tr key={e._id}>
            <td><Link to={'/events/'+e._id}>{e.name}</Link></td>
            <td>{e.type}{e.isTeamEvent?' [Team]':''}</td>
            <td>{e.organizerId?.organizerName||'-'}</td>
           <td>{e.startDate?new Date(e.startDate).toLocaleDateString():'-'} - {e.endDate?new Date(e.endDate).toLocaleDateString():'-'}</td>
           <td>{e.eligibility}</td>
             <td>{e.registrationFee||'Free'}</td>
         </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

export default BrowseEvents;
