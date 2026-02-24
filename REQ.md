# req map

where stuff is in the code


## 4 auth

4.1.1 participant registration
backend/routes/auth.js register endpoint. validates iiit email, hashes password,  creates user, jwt back
backend/models/User.js has the user fields
frontend/src/pages/Register.js the form

4.1.2 organizer login
admin creates organizer accounts (routes/admin.js), random password generated
routes/auth.js login endpoint shared by all roles, checks active flag
pages/Login.js and pages/ManageOrgs.js

4.1.3 admin
seed.js creates admin@felicity.gg/admin123

4.2 security
middleware/auth.js jwt verify,  checks active flag
bcrypt hash on register, compare on login (routes/auth.js)
role check guards on admin/organizer/participant routes
api.js frontend interceptor adds bearer token, redirects on 401
App.js Guard component  blocks wrong roles

4.3 sessions
ctx.js reads token from localstorage on mount, calls /auth/me
api.js injects token into requests
jwt signed with 7d expiry


## 5 onboarding

models/User.js interests and followedClubs arrays
routes/participant.js onboarding endpoint saves them
pages/Onboarding.js checkboxes for interests and clubs,  skip button
BrowseEvents.js sorts by interest match
Profile.js can edit later


## 6 data models

participant: firstName lastName email password participantType college contactNumber
organizer:  organizerName category description contactEmail discordWebhook
all in models/User.js


## 7 event types

7.1 normal: has registrationDeadline dates limit fee customForm formLocked (models/Event.js)
routes/events.js create, pages/CreateEvent.js form builder, EventDetail.js renders form

7.2 merch: items array with variants (size color stock) and purchaseLimit
routes/participant.js purchase endpoint validates stock and limits
CreateEvent.js item builder,  EventDetail.js cart ui


## 8 event attributes

all on models/Event.js: name description type eligibility dates limit fee organizerId tags status customForm formLocked items isTeamEvent teamSizes registrationCount


## 9 participant features

9.1 nav: Nav.js role conditional links

9.2 dashboard: routes/participant.js registrations endpoint, Dashboard.js tabs

9.3 browse: routes/events.js fuzzy search + filters + trending, BrowseEvents.js

9.4 event detail: routes/events.js get by id, EventDetail.js

9.5 registration: Registration model, routes/participant.js register/purchase/proof endpoints, EventDetail.js + Ticket.js

9.6 profile: routes/participant.js profile + password update, Profile.js

9.7 clubs:  routes/participant.js organizers list + follow/unfollow, Clubs.js

9.8 organizer detail: routes/participant.js organizer + events, ClubDetail.js


## 10 organizer features

10.1 nav: Nav.js organizer branch

10.2 dashboard: routes/organizer.js events + analytics, OrgDash.js OrgOngoing.js

10.3 event detail: routes/organizer.js event + regs + analytics + export csv, OrgEventDetail.js

10.4 create/edit: routes/events.js create + edit + status transitions, CreateEvent.js

10.5 profile: routes/organizer.js profile update, discord webhook on publish, OrgProfile.js


## 11 admin

11.1 nav: Nav.js admin branch

11.2 manage orgs: routes/admin.js crud organizers, AdminDash.js ManageOrgs.js


## 12 deployment

deployment.txt has urls
server.js uses MONGO_URI and PORT env vars


## 13 advanced

13.1.1 team reg (tier A)
Team model with inviteCode and members with accept/reject status
routes/teams.js create/join/respond,  auto generates tickets when min size met
TeamPage.js, EventDetail.js shows team link

13.1.2 payment approval (tier A)
Registration has paymentProof paymentStatus fields
routes/participant.js purchase + proof upload
routes/organizer.js approve/reject payment,  approve generates ticket, reject restores stock
Ticket.js proof upload, OrgEventDetail.js approval buttons

13.2.1 forum (tier B)
ForumPost model with threading (parentId) pinning reactions
server.js socket.io rooms per event
routes/forum.js crud + pin + react with socket emit
EventDetail.js socket client,  threaded display, moderation

13.2.2 password reset (tier B)
PasswordReset model
routes/auth.js forgot password from login
routes/organizer.js request, routes/admin.js approve/reject
OrgProfile.js request + history, PwdResets.js admin view, Login.js shows after 3 fails

13.3.1 feedback (tier C)
Feedback model rating + comment
routes/feedback.js post (checks registration) get (strips userId for anonymity)
EventDetail.js submit + display,  OrgEventDetail.js aggregated view
