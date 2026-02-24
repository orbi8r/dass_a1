# Felicity Event Management

event management platform for iiit hyderabad felicity fest.  MERN stack.


## libs and frameworks

### backend
- express - rest api framework, straightforward routing and middleware stuff
- mongoose -  mongodb odm for schema validation and queries
- bcryptjs - password hashing. chose over bcrypt cuz no native compile needed
- jsonwebtoken -  jwt for stateless auth
- cors - need it for cross origin requests since frontend and backend are on different origins
- dotenv - loads .env vars
- multer -  handles file uploads (payment proofs etc)
- qrcode - generates qr codes as base64 data urls for tickets
- socket.io - websocket server for the realtime forum feature
- express-async-errors -  catches async errors in routes automatically
- nodemailer - email sending (optional, need smtp config)

### frontend

- react - ui framework, functional components + hooks
- react-dom  - rendering
- react-router-dom - client side routing with role based guards
- axios -  http client with interceptors for auto jwt injection
- socket.io-client - websocket client,  pairs with socket.io on backend
- react-scripts - CRA build tooling


## advanced features

### tier A

**hackathon team registration (8 marks)**

team leader creates a team and gets a unique invite code (crypto.randomBytes). members join with the code then accept/reject the invite.  once minimum size is reached with enough accepts, everyone gets auto registered and tickets+qr codes are generated. implementation uses mongoose refs between Team, Registration and Event models.chose this feature cuz its got complex state management with multiple users affecting the same team document.

**merchandise payment approval (8 marks)**

when a participant buys merch they can upload payment proof (image via multer). organizer reviews pending proofs and approves or rejects. approval generates ticket and qr code, rejection restores the variant stock back. uses paymentStatus field on Registration model with states none/pending/approved/rejected. picked this because it combines file uploads, inventory tracking and approval workflows into one feature.


### tier B

**realtime discussion forum (6 marks)**

socket.io powered forum on each event page.  threaded replies using parentId on ForumPost model. reactions (like and fire) with toggle. organizer can pin posts and delete any post, regular users can only delete their own.  uses socket.io rooms per event so messages only broadcast to people viewing that event.  went with this because websockets are interesting to implement and it shows proper realtime state sync.

**organizer password reset (6 marks)**

organizers submit  reset requests with a reason, admin reviews them. admin can approve (generates random password or sets a custom one) or reject with comment. request history tracked. chose this as it demonstrates a proper approval workflow between two roles with credential management.


### tier C

**anonymous feedback (2 marks)**

participants rate events 1 to 5 stars with optional comments.  one review per user per event enforced server side. only people who actually registered (or got merch purchase approved) can leave feedback. organizer sees aggregated ratings without user identity. simple but gets the job done for quality tracking.


## design decisions

single User model for all 3 roles with a role field instead of separate collections. Event model handles both normal and merchandise types, custom form array only used for normal events and items array only for merchandise. jwt stored in localStorage with 7 day expiry.  socket.io rooms scoped per event for forum. qr codes stored as base64 directly in registration document. file uploads go to disk via multer (would use s3 or something in prod). admin is seeded via script, no registration ui for admin.


### default admin

email: admin@felicity.gg
password: admin123
