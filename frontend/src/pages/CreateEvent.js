/*10.4*/
import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import api from '../api';

function CreateEvent(){
  var nav = useNavigate();
  var {id} = useParams();
  var isEdit = !!id;
  var [f,setF] = useState({
    name:'',description:'',type:'normal',eligibility:'all',
    registrationDeadline:'',startDate:'',endDate:'',
    registrationLimit:'',registrationFee:0,tags:'',
    isTeamEvent:false,minTeamSize:2,maxTeamSize:4,
    customForm:[],items:[],status:'draft'
  });
  var [msg,setMsg] = useState('');

  useEffect(function(){
    if(isEdit){
      api.get('/events/'+id).then(function(r){
        var d = r.data;
        d.tags = (d.tags||[]).join(',');
        d.registrationDeadline = d.registrationDeadline ? d.registrationDeadline.substring(0,16) : '';
        d.startDate = d.startDate ? d.startDate.substring(0,16) : '';
        d.endDate = d.endDate ? d.endDate.substring(0,16) : '';
        setF(d);
      });
    }
  },[id,isEdit]);

  var set = function(k,v){ setF(Object.assign({},f,{[k]:v})); };

  /*10.4*/
  var addField = function(){
    var cf = f.customForm.slice();
    cf.push({label:'',fieldType:'text',options:[],required:false,order:cf.length});
    set('customForm',cf);
  };
  var updateField = function(i,k,v){
    var cf = f.customForm.slice();
    cf[i] = Object.assign({},cf[i],{[k]:v});
    set('customForm',cf);
  };
  var removeField = function(i){
    var cf = f.customForm.slice();
    cf.splice(i,1);
    set('customForm',cf);
  };
  var moveField = function(i,dir){
    var cf = f.customForm.slice();
    var j = i+dir;
    if(j<0||j>=cf.length) return;
    var tmp = cf[i]; cf[i]=cf[j]; cf[j]=tmp;
    cf.forEach(function(c,idx){c.order=idx});
    set('customForm',cf);
  };

  /*7.2*/
  var addItem = function(){
    var items = f.items.slice();
    items.push({name:'',price:0,variants:[{size:'',color:'',stock:0}],purchaseLimit:1});
    set('items',items);
  };
  var updateItem = function(i,k,v){
    var items = f.items.slice();
    items[i] = Object.assign({},items[i],{[k]:v});
    set('items',items);
  };
  var removeItem = function(i){
    var items = f.items.slice();
    items.splice(i,1);
    set('items',items);
  };
  var addVariant = function(i){
    var items = f.items.slice();
    items[i].variants.push({size:'',color:'',stock:0});
    set('items',items);
  };
  var updateVariant = function(ii,vi,k,v){
    var items = f.items.slice();
    items[ii].variants[vi] = Object.assign({},items[ii].variants[vi],{[k]:v});
    set('items',items);
  };

  var save = async function(publish){
    if(!f.name.trim()) return setMsg('Event name is required');
    if(f.type!=='merchandise' && !f.startDate) return setMsg('Start date is required');
    var data = Object.assign({},f);
    data.tags = (data.tags||'').split(',').map(function(t){return t.trim()}).filter(Boolean);
    try {
      if(isEdit){
        var updated = await api.put('/events/'+id, data);
        if(publish && f.status==='draft'){
          await api.patch('/events/'+id+'/status',{status:'published'});
        }
        var fresh = (await api.get('/events/'+id)).data;
        fresh.tags = (fresh.tags||[]).join(',');
        fresh.registrationDeadline = fresh.registrationDeadline ? fresh.registrationDeadline.substring(0,16) : '';
        fresh.startDate = fresh.startDate ? fresh.startDate.substring(0,16) : '';
        fresh.endDate = fresh.endDate ? fresh.endDate.substring(0,16) : '';
        setF(fresh);
        setMsg('Event updated successfully');
      } else {
        data.status = 'draft';
        var r = await api.post('/events', data);
        if(publish){
          await api.patch('/events/'+r.data._id+'/status',{status:'published'});
        }
        nav('/org/event/'+r.data._id);
      }
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  return <div>
    <h1>{isEdit?'Edit':'Create'} Event</h1><hr/>
    {msg && <p><b>{msg}</b></p>}
    <label>Name: <input value={f.name} onChange={function(e){set('name',e.target.value)}} size="40"/></label>
    <label>Description: <textarea value={f.description||''} onChange={function(e){set('description',e.target.value)}} cols="50" rows="3"/></label>
    <label>Type: <select value={f.type} onChange={function(e){set('type',e.target.value)}}>
      <option value="normal">Normal</option><option value="merchandise">Merchandise</option>
    </select></label>
    <label>Eligibility: <select value={f.eligibility} onChange={function(e){set('eligibility',e.target.value)}}>
      <option value="all">All</option><option value="iiit">IIIT Only</option><option value="non-iiit">Non-IIIT Only</option>
    </select></label>
    <label>Registration Deadline: <input type="datetime-local" value={f.registrationDeadline||''} onChange={function(e){set('registrationDeadline',e.target.value)}}/></label>
    {f.type!=='merchandise' && <>
      <label>Start Date: <input type="datetime-local" value={f.startDate||''} onChange={function(e){set('startDate',e.target.value)}}/></label>
      <label>End Date: <input type="datetime-local" value={f.endDate||''} onChange={function(e){set('endDate',e.target.value)}}/></label>
    </>}
    <label>Registration Limit: <input type="number" value={f.registrationLimit||''} onChange={function(e){set('registrationLimit',Number(e.target.value))}}/></label>
    <label>Registration Fee: <input type="number" value={f.registrationFee||0} onChange={function(e){set('registrationFee',Number(e.target.value))}}/></label>
    <label>Tags (comma separated): <input value={f.tags||''} onChange={function(e){set('tags',e.target.value)}} size="40"/></label>

    {f.type==='normal' && <>
      <label><input type="checkbox" checked={f.isTeamEvent} onChange={function(e){set('isTeamEvent',e.target.checked)}}/> Team Event (Hackathon)</label>
      {f.isTeamEvent && <>
        <label>Min Team Size: <input type="number" value={f.minTeamSize} onChange={function(e){set('minTeamSize',Number(e.target.value))}}/></label>
        <label>Max Team Size: <input type="number" value={f.maxTeamSize} onChange={function(e){set('maxTeamSize',Number(e.target.value))}}/></label>
      </>}
    </>}
    <hr/>

    {f.type==='normal' && <>
      <h2>Custom Registration Form {f.formLocked && '(LOCKED - has registrations)'}</h2>
      {!f.formLocked && <>
        {f.customForm.map(function(field,i){
          return <div key={i} className="card">
            <label>Label: <input value={field.label} onChange={function(e){updateField(i,'label',e.target.value)}}/></label>
            <label>Type: <select value={field.fieldType} onChange={function(e){updateField(i,'fieldType',e.target.value)}}>
              <option value="text">Text</option><option value="textarea">Textarea</option>
              <option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option>
              <option value="file">File Upload</option>
            </select></label>
            {field.fieldType==='dropdown' && <label>Options (comma sep): <input value={(field.options||[]).join(',')} onChange={function(e){updateField(i,'options',e.target.value.split(','))}}/></label>}
            <label><input type="checkbox" checked={field.required} onChange={function(e){updateField(i,'required',e.target.checked)}}/> Required</label>
            <button onClick={function(){moveField(i,-1)}}>Up</button>
            <button onClick={function(){moveField(i,1)}}>Down</button>
            <button onClick={function(){removeField(i)}}>Remove</button>
          </div>;
        })}
        <button onClick={addField}>+ Add Field</button>
      </>}
    </>}

    {f.type==='merchandise' && <>
      <h2>Merchandise Items</h2>
      {f.items.map(function(item,ii){
        return <div key={ii} className="card">
          <label>Item Name: <input value={item.name} onChange={function(e){updateItem(ii,'name',e.target.value)}}/></label>
          <label>Price: <input type="number" value={item.price} onChange={function(e){updateItem(ii,'price',Number(e.target.value))}}/></label>
          <label>Purchase Limit: <input type="number" value={item.purchaseLimit} onChange={function(e){updateItem(ii,'purchaseLimit',Number(e.target.value))}}/></label>
          <h3>Variants:</h3>
          {item.variants.map(function(v,vi){
            return <div key={vi}>
              Size: <input value={v.size} onChange={function(e){updateVariant(ii,vi,'size',e.target.value)}} size="8"/>
              Color: <input value={v.color} onChange={function(e){updateVariant(ii,vi,'color',e.target.value)}} size="8"/>
              Stock: <input type="number" value={v.stock} onChange={function(e){updateVariant(ii,vi,'stock',Number(e.target.value))}} size="5"/>
            </div>;
          })}
          <button onClick={function(){addVariant(ii)}}>+ Variant</button>
          <button onClick={function(){removeItem(ii)}}>Remove Item</button>
        </div>;
      })}
      <button onClick={addItem}>+ Add Item</button>
    </>}
    <hr/>
    <button onClick={function(){save(false)}}>Save as Draft</button>{' '}
    <button onClick={function(){save(true)}}>Save & Publish</button>
  </div>;
}

export default CreateEvent;
