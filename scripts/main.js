/**
 * Copyright 2023 Google Inc. All Rights Reserved (crack).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';


// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var titleInput = document.getElementById('new-post-title');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var addButton = document.getElementById('add');
var recentPostsSection = document.getElementById('recent-posts-list');
var userPostsSection = document.getElementById('user-posts-list');
var topUserPostsSection = document.getElementById('top-user-posts-list');
var recentMenuButton = document.getElementById('menu-recent');
var myPostsMenuButton = document.getElementById('menu-my-posts');
var myTopPostsMenuButton = document.getElementById('menu-my-top-posts');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
   // Your web app's Firebase configuration
 const firestore = firebase.firestore();
 firebase.analytics();
function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture,
    time: firebase.firestore.FieldValue.serverTimestamp(),
    timestamp: new Intl.DateTimeFormat('en-US', {dateStyle: 'long', timeStyle: 'long'}).format(new Date())
  };

 firestore.collection("posts").add(postData).then(() => {
     console.log("Document successfully written!");
 });
}

/**
 * Star/unstar post.
 */

/**
 * for/users.
 */



function toggleStar(postRef, uid) {
    // // 👇️ [ 'bobby', crack ]
  postRef.get().then(function(post) {
    if (post) {
      var crack = post.data().starCount;
      if (post.data().stars && post.data().stars.includes(uid)) {
       postRef.update({
         starCount: crack-1,
         stars: firebase.firestore.FieldValue.arrayRemove(uid)
        });
        // Remove the 'Cr' field from the document
      } else {
       postRef.update({
         starCount: crack+1,
         stars: firebase.firestore.FieldValue.arrayUnion(uid)
        });
      }
    }
    return post;
  });
}

/**
 * Creates a post element.
 */

// Gets the first message
function createPostElement(postId, title, text, author, authorId, authorPic,time) {
  var uid = firebase.auth().currentUser.uid;

  var html =
     '<div class="post post-' + postId + ' mdl-cell mdl-cell--12-col ' +
     'mdl-cell--15-col-tablet mdl-cell--15-col-desktop mdl-grid">' +
     '<div class="user-block">'+
     '<img class="brand-image img-circle elevation-3">'+
     '<span class="username mdl-color-text--light-blue-600"></span>'+
     '<span class="description">Shared publicly - 7:30 PM today</span>'+
     '<div class="mdl-card__title mdl-color-text--black">' +
     '<h4 class="mdl-card__title-text"></h4>' +
     '</div>' +
     '<div class="text"></div>' +
     '<div class="comments-container">' +
     '</div>' +
     '<form class="add-comment" action="#">' +
     '<input class="form-control new-comment" type="text" placeholder="Type a comment">' +
     '</form>' +
     '</div>'+
     '<div class="card">' +
     '<span class="star">' +
     '<div class="not-starred material-icons">star_border</div>' +
     '<div class="starred material-icons">star</div>' +
      '<div class="star-count">0</div>'+
     '</span>' +
     '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('form-control')[0]);
  }

  var addCommentForm = postElement.getElementsByClassName('add-comment')[0];
  var commentInput = postElement.getElementsByClassName('new-comment')[0];
  var star = postElement.getElementsByClassName('starred')[0];
  var unStar = postElement.getElementsByClassName('not-starred')[0];

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
  postElement.getElementsByClassName('description')[0].innerText = time;
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
  postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  postElement.getElementsByClassName('brand-image')[0].style.backgroundImage = 'url("' +
      (authorPic || './silhouette.jpg') + '")';

  // Listen for comments.
  var commentsRef = firestore.collection("posts").doc(postId).collection("comments");

    commentsRef.onSnapshot(querySnapshot => {
    querySnapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
      console.log('New : ', change.doc.data());
      addCommentElement(postElement, change.doc.id, change.doc.data().text, change.doc.data().author);
      }
      if (change.type === 'modified') {
        console.log('Modified : ', change.doc.data());
        setCommentValues(postElement, change.doc.id, change.doc.data().text, change.doc.data().author);
      }
      if (change.type === 'removed') {
        console.log('Removed : ', change.doc.data());
        deleteComment(postElement, change.doc.id);
      }
    });
  });



  // Listen for likes counts.
   var starCountRef = firestore.collection('posts').doc(postId).get().then(function(snapshot) {
      updateStarCount(postElement, snapshot.data().starCount);
});

  // Listen for the starred status.
      const starredStatusRef = firestore.collection('posts').doc(postId);
      starredStatusRef
      .onSnapshot((snapshot) => {
       if (snapshot.data().stars && snapshot.data().stars.includes(uid)) {
        updateStarredByCurrentUser(postElement, snapshot.data().stars);
       } else {
        updateStarredByCurrentUser(postElement);
       }
      }, (error) => {
        console.log(error);
      });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(commentsRef);
  listeningFirebaseRefs.push(starCountRef);
  listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  addCommentForm.onsubmit = function(e) {
    e.preventDefault();
    createNewComment(postId,firebase.auth().currentUser.displayName, uid, commentInput.value);
    commentInput.value = '';
    commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };

  // Bind starring action.
  var onStarClicked = function() {
    var crack = firestore.collection('posts').doc(postId);
    toggleStar(crack, uid);
  };

  unStar.onclick = onStarClicked;
  star.onclick = onStarClicked;
  return postElement;
}

/**
 * Writes a new comment for the given post.
 */

function createNewComment(postId,username, uid, text) {
    firestore.collection("posts").doc(postId).collection("comments").add({
       text: text,
       author: username,
       uid: uid,
       timestamp: firebase.firestore.FieldValue.serverTimestamp()
       }).then(() => {
        console.log(postId);
    });
}

/**
 * Updates the starred status of the post.
 */

function updateStarredByCurrentUser(postElement, starred) {
  if (starred) {
    postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
  } else {
    postElement.getElementsByClassName('starred')[0].style.display = 'none';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
  }
}

/**
 * Updates the number of stars displayed for a post.
 */
function updateStarCount(postElement, nbStart) {
  console.log(nbStart);
  postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}

/**
 * Creates a comment element and adds it to the given postElement.
 */

function addCommentElement(postElement, id, text, author) {
  var comment = document.createElement('div');
  comment.classList.add('comment-' + id);
  comment.innerHTML =  '</span> <p> <span class="float-right"><class="link-black text-sm"><i class="far fa-comments mr-1"></i> Comments</a></span></p><span class="username"></span><span class="comment">';
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
  commentsContainer.appendChild(comment);
}

/**
 * Sets the comment's values in the given postElement.
 */

function setCommentValues(postElement, id, text, author) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author;
}

/**
 * Deletes the comment of the given ID in the given postElement.
 */

function deleteComment(postElement, id) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.parentElement.removeChild(comment);
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  var myUserId = firebase.auth().currentUser.uid;
  var topUserPostsRef = firestore.collection('posts').where('uid', '==', myUserId).orderBy('starCount');
  var recentPostsRef = firestore.collection("posts").limit(100).orderBy('time');;
  var userPostsRef = firestore.collection('posts').where('uid', '==', myUserId).orderBy('time');


  var fetchPosts = function(postsRef, sectionElement) {

    postsRef.onSnapshot(querySnapshot => {
    querySnapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
      console.log('New : ', change.doc.data());
      var author = change.doc.data().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
      createPostElement(change.doc.id, change.doc.data().title, change.doc.data().body, author, change.doc.data().uid, change.doc.data().authorPic, change.doc.data().timestamp),
      containerElement.firstChild);
      }
      if (change.type === 'modified') {
        console.log('Modified : ', change.doc.data());
          var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
          var postElement = containerElement.getElementsByClassName('post-' + change.doc.id)[0];
          postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = change.doc.data().title;
          postElement.getElementsByClassName('username')[0].innerText = change.doc.data().author;
          postElement.getElementsByClassName('text')[0].innerText = change.doc.data().body;
          postElement.getElementsByClassName('star-count')[0].innerText = change.doc.data().starCount;
      }
      if (change.type === 'removed') {
        console.log('Removed : ', change.doc.data());
         var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
         var post = containerElement.getElementsByClassName('post-' + change.doc.id)[0];
         post.parentElement.removeChild(post);
      }
    });
  });

  };

  // Fetching and displaying all posts of each sections.
  fetchPosts(topUserPostsRef, topUserPostsSection);
  fetchPosts(recentPostsRef, recentPostsSection);
  fetchPosts(userPostsRef, userPostsSection);

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(topUserPostsRef);
  listeningFirebaseRefs.push(recentPostsRef);
  listeningFirebaseRefs.push(userPostsRef);
}
/**
 * Writes the user's data to the database.
 */

function writeUserData(userId, name, email, imageUrl) {
 firestore.collection('users').doc(userId).set({
     username: name,
     email: email,
     profile_picture : imageUrl,
     timestamp: firebase.firestore.FieldValue.serverTimestamp()
 }).then(() => {
     console.log("Document successfully written!");
 }).catch((error) => {
     console.error("Error writing document: ", error);
 });
}

/**
 * Cleanups the UI and removes all Firebase listeners.
 */

function cleanupUi() {
  // Remove all previously displayed posts.
  topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
      // Display the splash page where you can sign-in.
      splashPage.style.display = '';
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */

function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    firestore.collection('users').doc(currentUID).get().then(function(snapshot) {
    if (!snapshot.exists) {
      writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    } else {
    fetch('https://api.ipify.org').then((res) => res.text()).then(
    ip =>
     firestore.collection('users').doc(currentUID).update({
      ip: ip,
      Last: firebase.firestore.FieldValue.serverTimestamp()
     })
    ).catch(err => console.log(err))
    console.log('Document data:', snapshot.data());
    }
   });
    startDatabaseQueries();
    document.getElementById('photo').src = user.photoURL;
    document.getElementById('d-block').textContent = user.displayName;
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new post for the current user.
 */

function newPostForCurrentUser(title, text) {
  var userId = firebase.auth().currentUser.uid;
  return firestore.collection('users').doc(userId).get().then(function(snapshot) {
    var username = (snapshot.data() && snapshot.data().username) || 'Anonymous';
    return writeNewPost(firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL, title, text);
  });
}

/**
 * Displays the given section element and changes styling of the given button.
 */

function showSection(sectionElement, buttonElement) {
  recentPostsSection.style.display = 'none';
  userPostsSection.style.display = 'none';
  topUserPostsSection.style.display = 'none';
  addPost.style.display = 'none';
  recentMenuButton.classList.remove('is-active');
  myPostsMenuButton.classList.remove('is-active');
  myTopPostsMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}


// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  messageForm.onsubmit = function(e) {
    e.preventDefault();
    var text = messageInput.value;
    var title = titleInput.value;
    if (text && title) {
      newPostForCurrentUser(title, text).then(function() {
        myPostsMenuButton.click();
      });
      messageInput.value = '';
      titleInput.value = '';
    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentPostsSection, recentMenuButton);
  };

  myPostsMenuButton.onclick = function() {
    showSection(userPostsSection, myPostsMenuButton);
  };

  myTopPostsMenuButton.onclick = function() {
    showSection(topUserPostsSection, myTopPostsMenuButton);
  };

  addButton.onclick = function() {
    showSection(addPost);
    messageInput.value = '';
    titleInput.value = '';
  };
  recentMenuButton.onclick();
}, false);


