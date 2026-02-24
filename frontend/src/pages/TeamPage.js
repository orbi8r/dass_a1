/*13.1.1*/
import React, {useState, useEffect, useContext} from 'react';
import {useParams} from 'react-router-dom';
import api from '../api';
import {AuthCtx} from '../ctx';

function TeamPage(){
  var {eventId} = useParams();
  var {user} = useContext(AuthCtx);
  var [team,setTeam] = useState(null);
  var [evt,setEvt] = useState(null);
  var [name,setName] = useState('');
  var [code,setCode] = useState('');
  var [msg,setMsg] = useState('');

  var load = function(){
    api.get('/teams/event/'+eventId).then(function(r){setTeam(r.data)}).catch(function(){});
    api.get('/events/'+eventId).then(function(r){setEvt(r.data)}).catch(function(){});
  };

  useEffect(load,[eventId]);

  var createTeam = async function(){
    try {
      var r = await api.post('/teams',{eventId:eventId,name:name});
      setTeam(r.data); setMsg('Team created! Invite code: '+r.data.inviteCode);
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var joinTeam = async function(){
    try {
      var r = await api.post('/teams/join',{inviteCode:code});
      setTeam(r.data); setMsg('Joined team');
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var respond = async function(status){
    try {
      var r = await api.patch('/teams/'+team._id+'/respond',{status:status});
      setTeam(r.data); setMsg('Response recorded');
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  return <div>
    <h1>Team Registration{evt?' - '+evt.name:''}</h1><hr/>
    {msg && <p><b>{msg}</b></p>}

    {!team && <div>
      <h2>Create a Team</h2>
      <label>Team Name: <input value={name} onChange={function(e){setName(e.target.value)}}/></label>
      <button onClick={createTeam}>Create</button>
      <hr/>
      <h2>Join a Team</h2>
      <label>Invite Code: <input value={code} onChange={function(e){setCode(e.target.value)}}/></label>
      <button onClick={joinTeam}>Join</button>
    </div>}

    {team && <div>
      <h2>Team: {team.name}</h2>
      <p>Invite Code: <b>{team.inviteCode}</b> (share with teammates)</p>
      <p>Status: {team.isComplete?'COMPLETE':'Waiting for members'}</p>
      <p>Size: {team.members?.length||0} / {team.maxSize} (min: {team.minSize})</p>
      <table>
        <thead><tr><th>Member</th><th>Email</th><th>Status</th></tr></thead>
        <tbody>
          {(team.members||[]).map(function(m,i){
            var u = m.userId;
            return <tr key={i}>
              <td>{u?.firstName||'?'} {u?.lastName||''}</td>
              <td>{u?.email||'-'}</td>
              <td>{m.status}
                {m.status==='pending' && u?._id===user?._id && <>
                  {' '}<button onClick={function(){respond('accepted')}}>Accept</button>
                  {' '}<button onClick={function(){respond('rejected')}}>Reject</button>
                </>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>}
  </div>;
}

export default TeamPage;
