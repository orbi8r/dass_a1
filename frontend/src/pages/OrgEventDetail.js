/*10.3*/
import React, {useState, useEffect} from 'react';
import {useParams, Link} from 'react-router-dom';
import api from '../api';

function OrgEventDetail(){
  var {id} = useParams();
  var [data,setData] = useState(null);
  var [search,setSearch] = useState('');
  var [tab,setTab] = useState('overview');
  var [msg,setMsg] = useState('');
  var [fbs,setFbs] = useState({feedback:[],averageRating:0,count:0});
  var [fbFilter,setFbFilter] = useState('');

  var load = function(){
    api.get('/organizer/events/'+id).then(function(r){ setData(r.data); }).catch(function(ex){ setMsg(ex.response?.data?.msg||'failed to load event'); });
  };
  var loadFeedback = function(ratingVal){
    var params = {};
    if(ratingVal) params.rating = ratingVal;
    api.get('/feedback/'+id, {params:params}).then(function(r){ setFbs(r.data); }).catch(function(){});
  };
  useEffect(load,[id]);
  useEffect(function(){ loadFeedback(fbFilter); },[id,fbFilter]);


  var exportCsv = function(){
    window.open((process.env.REACT_APP_API_URL||'http://localhost:5000/api')+'/organizer/events/'+id+'/export?token='+localStorage.getItem('token'));
  };

  var changeStatus = async function(status){
    try {
      await api.patch('/events/'+id+'/status',{status:status});
      setMsg('Status changed to '+status);
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var handlePayment = async function(regId,action){
    try {
      await api.patch('/organizer/events/'+id+'/payment/'+regId,{action:action});
      setMsg(action==='approve'?'Payment approved':'Payment rejected');
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'payment action failed'); }
  };

  var toggleAttend = async function(regId){
    try {
      await api.patch('/organizer/events/'+id+'/attend/'+regId);
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  if(!data) return <p>loading...</p>;
  var e = data.event;
  var a = data.analytics;

  var pendingPayments = data.registrations.filter(function(r){return r.paymentStatus==='pending'});

  return <div>
    <h1>{e.name} (Organizer View)</h1><hr/>
    <div className="tabs">
      {['overview','participants','payments','feedback','analytics'].map(function(t){
        return <span key={t} className={tab===t?'active':''} onClick={function(){setTab(t)}}>{t}</span>;
      })}
    </div>
    <br/>
    {msg && <p><b>{msg}</b></p>}

    {tab==='overview' && <div>
      <table><tbody>
        <tr><td>Type</td><td>{e.type}{e.isTeamEvent?' [Team]':''}</td></tr>
        <tr><td>Status</td><td>{e.status}</td></tr>
        <tr><td>Eligibility</td><td>{e.eligibility}</td></tr>
        {e.type!=='merchandise' && <tr><td>Dates</td><td>{e.startDate?new Date(e.startDate).toLocaleString():'-'} to {e.endDate?new Date(e.endDate).toLocaleString():'-'}</td></tr>}
        <tr><td>Deadline</td><td>{e.registrationDeadline?new Date(e.registrationDeadline).toLocaleString():'-'}</td></tr>
        <tr><td>Limit</td><td>{e.registrationLimit||'Unlimited'}</td></tr>
        <tr><td>Fee</td><td>{e.registrationFee||'Free'}</td></tr>
        <tr><td>Registrations</td><td>{e.registrationCount}</td></tr>
      </tbody></table>
      <hr/>
      <Link to={'/org/event/'+id+'/edit'}>Edit Event</Link><br/>
      Status Actions:{' '}
      {e.status==='draft' && <button onClick={function(){changeStatus('published')}}>Publish</button>}
      {e.status==='published' && <><button onClick={function(){changeStatus('ongoing')}}>Start (Ongoing)</button>{' '}<button onClick={function(){changeStatus('closed')}}>Close</button></>}
      {e.status==='ongoing' && <><button onClick={function(){changeStatus('completed')}}>Complete</button>{' '}<button onClick={function(){changeStatus('closed')}}>Close</button></>}
      {e.status==='completed' && <button onClick={function(){changeStatus('closed')}}>Close</button>}
    </div>}

    {tab==='participants' && <div>
      <input value={search} onChange={function(e){setSearch(e.target.value)}} placeholder="Search by name/email" size="30"/>
      {' '}<button onClick={exportCsv}>Export CSV</button>
      <p>{(function(){
        var s = search.toLowerCase();
        return data.registrations.filter(function(r){
          if(!s) return true;
          var name = (r.userId?.firstName||'')+' '+(r.userId?.lastName||'');
          return name.toLowerCase().indexOf(s)!==-1 || (r.userId?.email||'').toLowerCase().indexOf(s)!==-1;
        }).length;
      })()} participants</p>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Reg Date</th><th>Status</th><th>Payment</th><th>Team</th><th>Ticket</th><th>Attended</th></tr></thead>
        <tbody>
          {(function(){
            var s = search.toLowerCase();
            return data.registrations.filter(function(r){
              if(!s) return true;
              var name = (r.userId?.firstName||'')+' '+(r.userId?.lastName||'');
              return name.toLowerCase().indexOf(s)!==-1 || (r.userId?.email||'').toLowerCase().indexOf(s)!==-1;
            }).map(function(r){
              return <tr key={r._id}>
                <td>{r.userId?.firstName} {r.userId?.lastName}</td>
                <td>{r.userId?.email}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>{r.status}</td>
                <td>{r.paymentStatus}</td>
                <td>{r.teamId?.name||'-'}</td>
                <td>{r.ticketId||'-'}</td>
                <td><button onClick={function(){toggleAttend(r._id)}}>{r.attended?'✅ Yes':'❌ No'}</button></td>
              </tr>;
            });
          })()}
        </tbody>
      </table>
    </div>}

    {tab==='payments' && <div>
      <h2>Pending Payment Approvals ({pendingPayments.length})</h2>
      {pendingPayments.length===0 && <p>None pending.</p>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Amount</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {pendingPayments.map(function(r){
            return <tr key={r._id}>
              <td>{r.userId?.firstName} {r.userId?.lastName}</td>
              <td>{r.userId?.email}</td>
              <td>Rs.{r.totalAmount}</td>
              <td>{r.paymentProof ? <a href={(process.env.REACT_APP_API_URL||'http://localhost:5000').replace('/api','')+'/uploads/'+r.paymentProof} target="_blank" rel="noreferrer">View Proof</a> : '-'}</td>
              <td>{r.paymentStatus}</td>
              <td>
                <button onClick={function(){handlePayment(r._id,'approve')}}>Approve</button>{' '}
                <button onClick={function(){handlePayment(r._id,'reject')}}>Reject</button>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
      <hr/>
      <h2>All Orders</h2>
      <table>
        <thead><tr><th>Name</th><th>Amount</th><th>Proof</th><th>Payment</th><th>Ticket</th></tr></thead>
        <tbody>
          {data.registrations.filter(function(r){return r.paymentStatus!=='none'}).map(function(r){
            return <tr key={r._id}>
              <td>{r.userId?.firstName} {r.userId?.lastName}</td>
              <td>Rs.{r.totalAmount}</td>
              <td>{r.paymentProof ? <a href={(process.env.REACT_APP_API_URL||'http://localhost:5000').replace('/api','')+'/uploads/'+r.paymentProof} target="_blank" rel="noreferrer">View</a> : '-'}</td>
              <td>{r.paymentStatus}</td>
              <td>{r.ticketId||'-'}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>}

    {tab==='analytics' && <div>
      <h2>Event Analytics</h2>
      <table><tbody>
        <tr><td>Total Registrations</td><td>{a.total}</td></tr>
        <tr><td>Approved/Active</td><td>{a.approved}</td></tr>
        <tr><td>Attendance</td><td>{a.attendance}</td></tr>
        {a.teamTotal>0 && <tr><td>Team Completion</td><td>{a.teamComplete}/{a.teamTotal} teams complete</td></tr>}
        <tr><td>Revenue</td><td>Rs.{a.revenue}</td></tr>
      </tbody></table>
    </div>}

    {tab==='feedback' && <div>
      <h2>Feedback (avg: {fbs.averageRating}/5, {fbs.count} total reviews)</h2>
      <div>
        Filter by rating:{' '}
        <select value={fbFilter} onChange={function(ev){setFbFilter(ev.target.value);}}>
          <option value="">All</option><option value="1">1 star</option><option value="2">2 stars</option><option value="3">3 stars</option><option value="4">4 stars</option><option value="5">5 stars</option>
        </select>
      </div>
      <table>
        <thead><tr><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
        <tbody>
          {fbs.feedback.map(function(f){
            return <tr key={f._id}>
              <td>{'★'.repeat(f.rating)}{'☆'.repeat(5-f.rating)}</td>
              <td>{f.comment||'-'}</td>
              <td>{new Date(f.createdAt).toLocaleDateString()}</td>
            </tr>;
          })}
        </tbody>
      </table>
      {fbs.feedback.length===0 && <p>No feedback yet.</p>}
    </div>}
  </div>;
}

export default OrgEventDetail;
