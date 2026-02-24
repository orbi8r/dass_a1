/*9.4*/
import React, {useState, useEffect, useContext, useRef} from 'react';
import {useParams, Link} from 'react-router-dom';
import api from '../api';
import {AuthCtx} from'../ctx';
import io from 'socket.io-client';

var SOCKET_URL= process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api','') :'http://localhost:5000';

function EventDetail(){
   var {id}= useParams();
  var {user}= useContext(AuthCtx);
  var[evt,setEvt] = useState(null);
  var [msg,setMsg]= useState('');
 var [formData,setFormData] = useState({});
  /*9.5*/
  var [cart,setCart]= useState([]);
  /*13.2.1*/
 var [posts,setPosts] = useState([]);
  var [forumMsg,setForumMsg]= useState('');
  var [replyTo,setReplyTo] = useState(null);
  var [newPostCount,setNewPostCount]=useState(0);
  var socketRef = useRef(null);
  /*13.3.1*/
  var [fbs,setFbs]= useState({feedback:[],averageRating:0,count:0});
  var [fbRating,setFbRating] = useState(3);
 var [fbComment,setFbComment]= useState('');
  var [fbFilter,setFbFilter] = useState('');
 var [myReg,setMyReg]= useState(null);

 useEffect(function(){
    api.get('/events/'+id).then(function(r){setEvt(r.data)}).catch(function(){});
  api.get('/forum/'+id).then(function(r){setPosts(r.data)}).catch(function(){});
    if(user) api.get('/participant/registrations').then(function(r){
     var found = r.data.find(function(reg){ return reg.eventId && (reg.eventId._id===id || reg.eventId===id); });
     setMyReg(found||null);
   }).catch(function(){});

    var s= io(SOCKET_URL);
    s.emit('joinEvent', id);
   s.on('newPost', function(p){ setPosts(function(prev){return prev.concat(p)});  setNewPostCount(function(n){return n+1;}); });
    s.on('deletePost', function(pid){ setPosts(function(prev){return prev.filter(function(p){return p._id!==pid})}); });
   s.on('updatePost', function(p){ setPosts(function(prev){return prev.map(function(pp){return pp._id===p._id?p:pp})}); });
     socketRef.current=  s;
   return function(){ s.emit('leaveEvent',id); s.disconnect(); };
  },[id]);

   var loadFeedback= function(ratingVal){
    var params= {};
    if(ratingVal) params.rating = ratingVal;
    api.get('/feedback/'+id, {params:params}).then(function(r){setFbs(r.data)});
   };

 useEffect(function(){loadFeedback(fbFilter); },[id,fbFilter]);

  if(!evt) return <p>loading...</p>;

  var deadlinePassed= evt.registrationDeadline && new Date() > new Date(evt.registrationDeadline);
 var full= evt.registrationLimit && evt.registrationCount>= evt.registrationLimit;

  /*9.5*/
  var registerNormal= async function(){
    try {
      await api.post('/participant/register/'+id, {formData:formData});
      setMsg('Registered! Check your dashboard for the ticket.');
       api.get('/participant/registrations').then(function(r){
      var found = r.data.find(function(reg){ return reg.eventId && (reg.eventId._id===id || reg.eventId===id); });
        setMyReg(found||null);
      });
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
 };

  /*9.5*/
  var purchaseMerch= async function(){
    var fd=  new FormData();
    fd.append('items', JSON.stringify(cart));
    try {
     var r= await api.post('/participant/purchase/'+id, fd, {headers:{'Content-Type':'multipart/form-data'}});
      setMsg('Purchase submitted! Go to your ticket to upload payment proof.');
      setCart([]);
    api.get('/participant/registrations').then(function(r){
      var found = r.data.find(function(reg){return reg.eventId &&  (reg.eventId._id===id || reg.eventId===id); });
        setMyReg(found||null);
     });
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
 };

  var addToCart = function(itemIdx, varIdx){
   var existing = cart.find(function(c){return c.itemIndex===itemIdx && c.variantIndex===varIdx});
    if(existing){ existing.quantity++; setCart(cart.slice()); }
    else { setCart(cart.concat({itemIndex:itemIdx, variantIndex:varIdx, quantity:1})); }
  };

  var removeFromCart= function(itemIdx, varIdx){
    setCart(cart.filter(function(c){ return !(c.itemIndex===itemIdx && c.variantIndex===varIdx);}));
 };

  var updateCartQty= function(itemIdx, varIdx, qty){
   if(qty <1){ removeFromCart(itemIdx, varIdx); return; }
    setCart(cart.map(function(c){
     if(c.itemIndex===itemIdx && c.variantIndex===varIdx) return Object.assign({},c,{quantity:qty});
      return c;
    }));
  };

  /*13.2.1*/
  var postForum= async function(){
   if(!forumMsg.trim()) return;
    try{
      await api.post('/forum/'+id, {content:forumMsg, parentId:replyTo});
       setForumMsg(''); setReplyTo(null);
    } catch(ex){ setMsg(ex.response?.data?.msg||'forum error'); }
  };

  var delPost= async function(pid){ try{ await api.delete('/forum/'+pid);  }catch(ex){setMsg(ex.response?.data?.msg||'delete error');} };
  var pinPost = async function(pid){ try{ await api.patch('/forum/'+pid+'/pin'); }catch(ex){setMsg(ex.response?.data?.msg||'pin error');} };
   var reactPost= async function(pid, type){
   var r= await api.post('/forum/'+pid+'/react', {type:type});
   setPosts(function(prev){return prev.map(function(p){return p._id===r.data._id?r.data:p})});
 };

  /*13.3.1*/
  var submitFeedback= async function(){
    try {
     await api.post('/feedback/'+id, {rating:fbRating, comment:fbComment});
       setMsg('Feedback submitted anonymously');
     setFbComment('');
      loadFeedback(fbFilter);
    }catch(ex){ setMsg(ex.response?.data?.msg||'failed');}
  };

  /*13.2.1*/
  var renderPosts= function(parentId){
   var filtered= posts.filter(function(p){return (p.parentId||null)===(parentId||null)});
    return filtered.map(function(p){
     var isOrg= p.userId?.role==='organizer';
      return <div key={p._id} style={{marginLeft:parentId?20:0, borderLeft:parentId?'1px solid #999':'none',  paddingLeft:parentId?6:0, marginTop:3,background:isOrg&&!parentId?'#fffbe6':undefined, borderTop:isOrg&&!parentId?'1px solid #ccc':undefined, padding:isOrg&&!parentId?4:undefined}}>
        <b>{p.userId?.firstName||'?'}{p.userId?.lastName||''}</b>
        {isOrg && <b> [ORGANIZER]</b>}
        {p.pinned && <b> [PINNED]</b>}
        {': '}{p.content}
        <span style={{fontSize:11,color:'#666'}}> ({new Date(p.createdAt).toLocaleString()})</span>
         {' '}<a href="#" onClick={function(e){e.preventDefault();setReplyTo(p._id)}}>reply</a>
         {' '}<a href="#" onClick={function(e){e.preventDefault();reactPost(p._id,'like')}}>like({(p.reactions||[]).filter(function(r){return r.type==='like'}).length})</a>
       {' '}<a href="#" onClick={function(e){e.preventDefault();reactPost(p._id,'fire')}}>fire({(p.reactions||[]).filter(function(r){return r.type==='fire'}).length})</a>
        {user && (user.role==='organizer' && evt.organizerId && String(user._id)===String(evt.organizerId._id)) && <span>
       {' '}<a href="#" onClick={function(e){e.preventDefault();pinPost(p._id)}}>{p.pinned?'unpin':'pin'}</a>
        {' '}<a href="#"  onClick={function(e){e.preventDefault();delPost(p._id)}}>del</a>
       </span>}
         {user && p.userId && String(user._id)===String(p.userId._id) && user.role!=='organizer' && <span>
          {' '}<a href="#" onClick={function(e){e.preventDefault();delPost(p._id)}}>del</a>
       </span>}
      {renderPosts(p._id)}
     </div>;
    });
  };

  return <div>
    <h1>{evt.name}</h1>
    <p>Type: {evt.type}{evt.isTeamEvent?' [Team Event]':''}</p>
    <p>{evt.description}</p>
    <table>
      <tbody>
        <tr><td>Eligibility</td><td>{evt.eligibility}</td></tr>
         {evt.type!=='merchandise'  && <>
          <tr><td>Start</td><td>{evt.startDate?new Date(evt.startDate).toLocaleString():'-'}</td></tr>
        <tr><td>End</td><td>{evt.endDate?new Date(evt.endDate).toLocaleString():'-'}</td></tr>
         </>}
        <tr><td>Deadline</td><td>{evt.registrationDeadline?new Date(evt.registrationDeadline).toLocaleString():'-'}</td></tr>
        <tr><td>Limit</td><td>{evt.registrationLimit||'Unlimited'} (registered: {evt.registrationCount})</td></tr>
        <tr><td>Fee</td><td>{evt.registrationFee||'Free'}</td></tr>
        <tr><td>Tags</td><td>{(evt.tags||[]).join(', ')}</td></tr>
        <tr><td>Organizer</td><td><Link to={'/clubs/'+evt.organizerId?._id}>{evt.organizerId?.organizerName||'-'}</Link></td></tr>
      </tbody>
    </table>
   <hr/>

    {msg && <p><b>{msg}</b></p>}

    {user && user.role==='participant' &&  <>
      {evt.type!=='merchandise' && deadlinePassed && <p className="err">Registration deadline has passed.</p>}
      {evt.type!=='merchandise' && full  && <p className="err">Registration limit reached.</p>}
      {myReg && myReg.paymentStatus==='pending' && <p className="ok"><b>Purchase submitted.</b>  Payment: pending approval| Status: {myReg.status}{myReg.ticketId && <> |<Link to={'/ticket/'+myReg.ticketId}>View Ticket</Link></>}</p>}
      {myReg && myReg.paymentStatus==='approved' && <p className="ok"><b>Payment approved!</b>{myReg.ticketId && <>| <Link to={'/ticket/'+myReg.ticketId}>View Ticket</Link></>}</p>}
      {myReg && myReg.paymentStatus==='rejected' && <p className="err"><b>Payment rejected.</b>{myReg.ticketId && <> | <Link to={'/ticket/'+myReg.ticketId}>Re-upload Proof</Link></>}</p>}
     {myReg && myReg.paymentStatus==='none' &&  myReg.status!=='pending_payment' && <p className="ok"><b>You are registered.</b>{myReg.ticketId && <> | <Link to={'/ticket/'+myReg.ticketId}>View Ticket & Upload Payment Proof</Link></>}</p>}

    {!deadlinePassed &&!full  && !myReg &&evt.type==='normal'  && !evt.isTeamEvent && <>
       <h2>Register</h2>
         {evt.customForm && evt.customForm.length>0&& <>
          <h3>Registration Form:</h3>
         {evt.customForm.sort(function(a,b){return(a.order||0)-(b.order||0)}).map(function(field,i){
            return <label key={i}>
             {field.label}{field.required?'*':''}:{' '}
             {field.fieldType==='text' &&<input onChange={function(e){setFormData(Object.assign({},formData,{[field.label]:e.target.value}))}}/>}
             {field.fieldType==='textarea'&& <textarea onChange={function(e){setFormData(Object.assign({},formData,{[field.label]:e.target.value}))}}/>}
            {field.fieldType==='dropdown' && <select onChange={function(e){setFormData(Object.assign({},formData,{[field.label]:e.target.value}))}}>
                <option value="">--select--</option>
                {(field.options||[]).map(function(o){return <option key={o} value={o}>{o}</option>})}
              </select>}
             {field.fieldType==='checkbox' && <input type="checkbox" onChange={function(e){setFormData(Object.assign({},formData,{[field.label]:e.target.checked}))}}/>}
              {field.fieldType==='file' && <input type="file" onChange={function(e){
                  if(!e.target.files[0]) return;
                 var fd = new FormData();
                 fd.append('file', e.target.files[0]);
               api.post('/participant/upload', fd, {headers:{'Content-Type':'multipart/form-data'}}).then(function(r){
                   setFormData(Object.assign({},formData,{[field.label]:r.data.filename}));
                });
             }}/>}
           </label>;
         })}
       </>}
        <button onClick={registerNormal}>Register Now</button>
      </>}

     {!deadlinePassed && !full && evt.isTeamEvent && <>
        <h2>Team Event</h2>
        <p>Team size: {evt.minTeamSize} -  {evt.maxTeamSize}</p>
        <Link to={'/team/'+evt._id}>Manage Team</Link>
      </>}

      {!myReg && evt.type==='merchandise' && <>
        <h2>Purchase Merchandise</h2>
        {(evt.items||[]).map(function(item,ii){
          return <div key={ii} className="card">
           <b>{item.name}</b> - Rs.{item.price} (limit: {item.purchaseLimit}/person)
            <br/>Variants:
             {(item.variants||[]).map(function(v,vi){
            var outOfStock = v.stock<=0;
              return <span key={vi}>
                {' '}{v.size}/{v.color} [stock:{v.stock}]
                  {outOfStock ?<span className="err">  OUT OF STOCK</span> :<button onClick={function(){addToCart(ii,vi)}}>Add</button>}
             </span>;
           })}
         </div>;
       })}
        {cart.length>0 && <div>
           <h3>Cart:</h3>
            <ul>{cart.map(function(c,i){
            var item = evt.items[c.itemIndex];
          var v = item?.variants[c.variantIndex];
           return <li key={i}>{item?.name} ({v?.size}/{v?.color}) x{c.quantity} = Rs.{(item?.price||0)*c.quantity}
            {' '}<button onClick={function(){updateCartQty(c.itemIndex,c.variantIndex,c.quantity-1)}}>-</button>
            {' '}<button onClick={function(){updateCartQty(c.itemIndex,c.variantIndex,c.quantity+1)}}>+</button>
               {' '}<button onClick={function(){removeFromCart(c.itemIndex,c.variantIndex)}}>Remove</button>
            </li>;
         })}</ul>
        <p><b>Total: Rs.{cart.reduce(function(s,c){return s+(evt.items[c.itemIndex]?.price||0)*c.quantity},0) + (evt.registrationFee||0)}</b>{evt.registrationFee  ? ' (includes Rs.'+evt.registrationFee+' event fee)' : ''}</p>
         <button onClick={purchaseMerch}>Submit Purchase</button>
        </div>}
      </>}
    </>}
    <hr/>

    {/*13.2.1*/}
    <h2>Discussion Forum {newPostCount>0  && <span style={{background:'red',color:'white',borderRadius:3,padding:'1px 5px',fontSize:12}}>{newPostCount} new</span>}</h2>
  {user&& <>
     {replyTo && <p>Replying to post... <a href="#" onClick={function(e){e.preventDefault();setReplyTo(null)}}>cancel</a></p>}
      <input value={forumMsg} onChange={function(e){setForumMsg(e.target.value)}} onFocus={function(){setNewPostCount(0)}} size="50" placeholder={user.role==='organizer'?'Post an announcement...':'Write a message...'}/>
      <button onClick={postForum}>Post</button>
    </>}
    <div style={{marginTop:6}}>
      {renderPosts(null)}
       {posts.length===0 && <p>No discussions yet.</p>}
    </div>
    <hr/>

   {/*13.3.1*/}
    <h2>Feedback ({fbs.count} reviews{fbs.count>0 ? ', avg: '+fbs.averageRating+'/5' : ''})</h2>
     {user &&  user.role==='participant' && (function(){
     var canSubmit = false;
      var reason=  '';
      if(evt.type==='merchandise' && (!myReg || myReg.paymentStatus!=='approved')){
       reason = myReg ? 'Feedback available after your purchase is approved.' : 'Purchase this event to leave feedback.';
    } else if(evt.type!=='merchandise' && (!myReg || myReg.status!=='registered')){
      reason = 'You must be registered for this event to leave feedback.';
      }  else {
        canSubmit = true;
      }
    return canSubmit ? <div>
        <b>Leave feedback(anonymous):</b>
        <br/>Rating:{' '}
        <select value={fbRating}onChange={function(e){setFbRating(Number(e.target.value))}}>
           <option value="1">* 1</option><option value="2">** 2</option><option value="3">*** 3</option><option value="4">**** 4</option><option value="5">***** 5</option>
         </select>
         {' '}<input value={fbComment} onChange={function(e){setFbComment(e.target.value)}} placeholder="Comment (optional)..." size="40"/>
        <button onClick={submitFeedback}>Submit</button>
      </div>  : <p style={{fontSize:12,color:'#555'}}>{reason}</p>;
    })()}
    <div style={{marginTop:6}}>
     Filter:{' '}
      <select value={fbFilter} onChange={function(e){setFbFilter(e.target.value);}}>
        <option value="">All ratings</option><option value="5">***** 5</option><option value="4">**** 4</option><option value="3">*** 3</option><option value="2">**2</option><option value="1">* 1</option>
     </select>
   </div>
     {fbs.feedback.length===0? <p>No reviews yet.</p>: <ul>
    {fbs.feedback.map(function(f){
      return <li key={f._id}><b>{'*'.repeat(f.rating)}{'.'.repeat(5-f.rating)}</b>{f.comment ? ' - '+f.comment : ''} <span style={{fontSize:11,color:'#777'}}>({new Date(f.createdAt).toLocaleDateString()})</span></li>;
     })}
    </ul>}
  </div>;
}

export default EventDetail;
