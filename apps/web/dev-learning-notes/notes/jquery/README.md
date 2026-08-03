# ?? jQuery and AJAX Notes

[<- Back to root](../README.md)

## ?? Purpose

Practical jQuery patterns for legacy-friendly frontends that call Spring Boot REST APIs.

## ?? Setup

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
```

## ?? Core AJAX Patterns

### GET

```javascript
$.ajax({
  url: '/users',
  type: 'GET',
  dataType: 'json',
  success: function (result) {
    if (result.resultCd === 'M0000') {
      renderTable(result.data);
    }
  },
  error: function (xhr, status, error) {
    alert('Failed to load users: ' + error);
  }
});
```

### GET with query params

```javascript
$.ajax({
  url: '/users',
  type: 'GET',
  data: { status: 'ACTIVE', page: 1, size: 10 }
});
// /users?status=ACTIVE&page=1&size=10
```

### POST

```javascript
$.ajax({
  url: '/users',
  type: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    username: $('#username').val(),
    email: $('#email').val(),
    status: 'ACTIVE'
  })
});
```

### PUT and DELETE

```javascript
$.ajax({
  url: '/users/' + id,
  type: 'PUT',
  contentType: 'application/json',
  data: JSON.stringify({ username: 'newname' })
});

$.ajax({
  url: '/users/' + id,
  type: 'DELETE'
});
```

## ??? DOM and Events

```javascript
$('#username').val();
$('#title').text('New Title');
$('#modal').toggle();
$('#btn').addClass('active');
```

```javascript
$(function () {
  loadUsers();
});

$('#saveBtn').click(function () {
  saveUser();
});

$(document).on('click', '.deleteBtn', function () {
  deleteUser($(this).data('id'));
});
```

## ?? Render Table Safely

```javascript
function renderTable(users) {
  const tbody = $('#userTable tbody');
  tbody.empty();

  if (!users || users.length === 0) {
    tbody.append('<tr><td colspan="5">No data</td></tr>');
    return;
  }

  users.forEach(function (user, index) {
    tbody.append(`
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${user.status}</td>
      </tr>
    `);
  });
}

function escapeHtml(str) {
  return $('<div>').text(str ?? '').html();
}
```

## ? Form Validation

```javascript
function saveUser() {
  const username = $('#username').val().trim();
  const email = $('#email').val().trim();

  if (!username) {
    alert('Username is required.');
    return;
  }
  if (!email.includes('@')) {
    alert('Valid email is required.');
    return;
  }

  $.ajax({
    url: '/users',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ username, email, status: 'ACTIVE' })
  });
}
```

## ??? Global Error Handling

```javascript
$(document).ajaxError(function (event, xhr) {
  if (xhr.status === 401) {
    window.location.href = '/login';
  } else if (xhr.status === 500) {
    alert('Server error. Please try again.');
  }
});
```

## ?? Quick Practice Rules

- Keep API response handling consistent (`resultCd`, `resultMsg`, `data`).
- Validate input before sending AJAX requests.
- Escape user-controlled values before injecting HTML.
- Use event delegation for dynamic elements.
