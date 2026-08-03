# 🧮 MyBatis Dynamic SQL

[<- Back to root](../README.md)

## 🎯 Purpose

Dynamic SQL helps you build safe, maintainable queries without manual SQL string concatenation.

## 🧱 Core Tags

| Tag | Use |
| --- | --- |
| `<if>` | Add condition only when a value exists |
| `<choose>/<when>/<otherwise>` | Branch logic (if-else) |
| `<where>` | Auto-add `WHERE` and remove leading `AND`/`OR` |
| `<set>` | Auto-build `SET` for update statements |
| `<foreach>` | Iterate list/map for `IN` or batch SQL |
| `<trim>` | Custom prefix/suffix cleanup |
| `<sql>` + `<include>` | Reusable SQL fragment |
| `<bind>` | Create runtime variable (often for `LIKE`) |

## 🔍 `<if>` with `<where>`

```xml
<select id="searchUsers" resultMap="UserMap">
  SELECT * FROM users
  <where>
    <if test="username != null and username != ''">
      AND username = #{username}
    </if>
    <if test="status != null">
      AND status = #{status}
    </if>
  </where>
</select>
```

## 🧭 `<choose>` for controlled sorting

```xml
ORDER BY
<choose>
  <when test="sortBy == 'username'">username</when>
  <when test="sortBy == 'createdAt'">created_at</when>
  <otherwise>id</otherwise>
</choose>
<choose>
  <when test="sortOrder == 'ASC'">ASC</when>
  <otherwise>DESC</otherwise>
</choose>
```

## 🔁 `<foreach>` for `IN` and batch operations

```xml
<select id="findByIds" resultMap="UserMap">
  SELECT * FROM users
  WHERE id IN
  <foreach collection="ids" item="id" open="(" close=")" separator=",">
    #{id}
  </foreach>
</select>
```

```xml
<insert id="batchInsert">
  INSERT INTO users (username, email, status) VALUES
  <foreach collection="users" item="user" separator=",">
    (#{user.username}, #{user.email}, #{user.status})
  </foreach>
</insert>
```

## 🛠️ `<set>` for partial update

```xml
<update id="dynamicUpdate">
  UPDATE users
  <set>
    <if test="username != null and username != ''">username = #{username},</if>
    <if test="email != null and email != ''">email = #{email},</if>
    <if test="status != null">status = #{status},</if>
  </set>
  WHERE id = #{id}
</update>
```

## ♻️ Reusable fragments

```xml
<sql id="userColumns">id, username, email, status, created_at</sql>

<select id="findAll" resultMap="UserMap">
  SELECT <include refid="userColumns"/>
  FROM users
  ORDER BY id DESC
</select>
```

## 🧷 XML Escaping Rules

| Char | Escape |
| --- | --- |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |

```xml
<if test="age &lt; 18">AND is_minor = true</if>
```

## 📜 SQL Logging

```properties
logging.level.com.yourpackage.mapper=DEBUG
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl
```

## ✅ Practical Checklist

- Keep SQL explicit and readable.
- Move shared columns to `<sql>` blocks.
- Use `<where>` and `<set>` to avoid malformed SQL.
- Validate dynamic sort/filter inputs on the service layer.

---

## 📘 Detailed Explanation

### 1. Why MyBatis is used in company projects

MyBatis is popular in enterprise projects because developers want SQL to stay visible and controllable.

With JPA, framework often generates SQL for you.
With MyBatis, you write SQL directly.

That is useful when:

- SQL is complex
- Oracle-specific syntax is needed
- tuning is important
- DB query must match company rules exactly

So MyBatis is often chosen when SQL control matters more than abstraction.

### 2. How MyBatis works conceptually

Think of MyBatis as a bridge:

```text
Java method call
  -> MyBatis mapper interface
  -> XML SQL template
  -> parameter binding
  -> SQL execution
  -> result mapping
  -> Java object list/result
```

You declare a Java method like:

```java
List<UserResponse> searchUsers(UserSearchRequest req);
```

Then MyBatis finds XML query with matching `id="searchUsers"` and runs it.

### 3. What dynamic SQL really means

Dynamic SQL means the final SQL changes depending on input values.

Example:

- if username exists, add username condition
- if status exists, add status condition
- if both exist, add both
- if neither exists, just run base query

This prevents writing many almost-identical SQL statements.

### 4. Why `<where>` and `<set>` matter so much

Without these tags, dynamic SQL easily breaks.

Common broken examples:

```sql
WHERE AND username = ?
```

```sql
SET username = ?, email = ?, WHERE id = ?
```

Those tiny syntax problems happen often in hand-built dynamic SQL.
MyBatis tags solve them for you.

### 5. How to think about `#{}` and `${}`

This is one of the most important MyBatis basics.

#### `#{}` means bound parameter

```xml
WHERE username = #{username}
```

This is safe and normal.
It becomes a prepared statement parameter.

#### `${}` means raw text insertion

```xml
ORDER BY ${sortColumn}
```

This inserts raw string directly into SQL.

That means:

- it can break SQL
- it can be unsafe
- it should be avoided for user input

Rule:

- use `#{}` by default
- use `${}` only in tightly controlled cases

### 6. Why `<choose>` is better than raw sort injection

Sorting looks simple, but it is one of the easiest places to create unsafe SQL.

Bad:

```xml
ORDER BY ${sortBy}
```

Better:

```xml
<choose>
  <when test="sortBy == 'username'">username</when>
  <otherwise>id</otherwise>
</choose>
```

This means only approved columns are allowed.

### 7. How result mapping works

When SQL returns rows, MyBatis must map them into Java objects.

That mapping can happen through:

- `resultType`
- `resultMap`

If DB column is:

```text
user_name
```

and Java field is:

```text
userName
```

then:

```properties
mybatis.configuration.map-underscore-to-camel-case=true
```

helps map them automatically.

For more complex cases, `resultMap` is better.

### 8. How to debug MyBatis when query feels wrong

Use this order:

1. check mapper method name
2. check XML `id`
3. check parameter object fields
4. check SQL log output
5. check whether dynamic conditions were included
6. check whether result mapping matches Java fields

A lot of MyBatis bugs are not SQL bugs.
They are:

- wrong field names
- null input values
- wrong XML id
- wrong namespace
- wrong result mapping

### 9. Real reading method for mapper XML

When reading a mapper XML file:

1. find `<select>/<insert>/<update>/<delete>`
2. read the static SQL first
3. then read the dynamic tags
4. ask “when will this condition appear?”
5. imagine one real input example
6. imagine the final SQL after MyBatis builds it

If you can mentally build final SQL from XML, your MyBatis skill is improving.

---

## 🧪 Better Understanding Questions

Try answering these in your own words:

1. Why would a company choose MyBatis over JPA?
2. What is the difference between `#{}` and `${}`?
3. Why is `<where>` useful?
4. Why is `<set>` useful?
5. How does MyBatis know which XML query to execute?

---

## 🛠️ Small Practice Tasks

### Task 1

Write a dynamic user search with:

- username
- status
- role

all optional.

### Task 2

Write a safe sortable query that only allows:

- `created_at`
- `username`
- `id`

### Task 3

Write a partial update for:

- email
- phone
- status

### Task 4

Explain what SQL will be generated when:

```text
username = 'kim'
status = null
```

for the `<if>` + `<where>` example.

If you can explain the final generated SQL clearly, you are starting to really understand MyBatis.
