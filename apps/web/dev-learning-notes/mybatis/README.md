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
