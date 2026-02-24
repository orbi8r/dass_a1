import React, {useContext} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from'react-router-dom';
import {AuthProvider, AuthCtx} from './ctx';
import Nav from'./Nav';
import Login from './pages/Login';
import Register from'./pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import ClubDetail from'./pages/ClubDetail';
import Ticket from './pages/Ticket';
import TeamPage from './pages/TeamPage';
import OrgDash from'./pages/OrgDash';
import CreateEvent from './pages/CreateEvent';
import OrgEventDetail from  './pages/OrgEventDetail';
import OrgProfile from './pages/OrgProfile';
import OrgOngoing from './pages/OrgOngoing';
import AdminDash from './pages/AdminDash';
import ManageOrgs from './pages/ManageOrgs';
import PwdResets from  './pages/PwdResets';

/*4.2*/
function Guard({role, children}){
  var {user}=useContext(AuthCtx);
  if(!user)return <Navigate to="/login"/>;
  if(role && user.role!==role) return <Navigate to="/login"/>;
 return children;
}

function AppRoutes(){
  return<>
   <Nav/>
    <Routes>
     <Route path="/login" element={<Login/>}/>
     <Route path="/register" element={<Register/>}/>
      <Route path="/onboarding" element={<Guard role="participant"><Onboarding/></Guard>}/>
      <Route path="/dashboard" element={<Guard role="participant"><Dashboard/></Guard>}/>
     <Route path="/events" element={<Guard role="participant"><BrowseEvents/></Guard>}/>
      <Route path="/events/:id" element={<Guard role="participant"><EventDetail/></Guard>}/>
    <Route path="/profile" element={<Guard role="participant"><Profile/></Guard>}/>
     <Route path="/clubs"element={<Guard role="participant"><Clubs/></Guard>}/>
    <Route path="/clubs/:id" element={<Guard role="participant"><ClubDetail/></Guard>}/>
      <Route path="/ticket/:ticketId" element={<Guard role="participant"><Ticket/></Guard>}/>
     <Route path="/team/:eventId" element={<Guard role="participant"><TeamPage/></Guard>}/>
      <Route path="/org/dashboard" element={<Guard role="organizer"><OrgDash/></Guard>}/>
     <Route path="/org/create" element={<Guard role="organizer"><CreateEvent/></Guard>}/>
       <Route path="/org/event/:id" element={<Guard role="organizer"><OrgEventDetail/></Guard>}/>
       <Route path="/org/event/:id/edit" element={<Guard role="organizer"><CreateEvent/></Guard>}/>
      <Route path="/org/profile" element={<Guard role="organizer"><OrgProfile/></Guard>}/>
      <Route path="/org/ongoing" element={<Guard role="organizer"><OrgOngoing/></Guard>}/>
     <Route path="/admin/dashboard" element={<Guard role="admin"><AdminDash/></Guard>}/>
      <Route path="/admin/organizers" element={<Guard role="admin"><ManageOrgs/></Guard>}/>
      <Route path="/admin/resets" element={<Guard role="admin"><PwdResets/></Guard>}/>
       <Route path="/" element={<Navigate to="/login"/>}/>
   </Routes>
   </>;
}

function App(){
  return <BrowserRouter>
   <AuthProvider>
      <AppRoutes/>
     </AuthProvider>
  </BrowserRouter>;
}

export default App;
