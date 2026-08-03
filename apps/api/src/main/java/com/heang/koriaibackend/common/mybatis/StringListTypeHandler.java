package com.heang.koriaibackend.common.mybatis;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.Array;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

/**
 * Maps a PostgreSQL {@code text[]} column to a {@code List<String>}.
 * Used for {@code tasks.tags}.
 */
// @MappedTypes(List.class) tells MyBatis: "use this handler whenever a mapped
// field/parameter type is List." BaseTypeHandler does the null-checking for us
// and only calls our methods below for the non-null case.
@MappedTypes(List.class)
public class StringListTypeHandler extends BaseTypeHandler<List<String>> {

    // Java -> Postgres, called when binding a List<String> into an INSERT/UPDATE param.
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType)
            throws SQLException {
        // JDBC has no built-in List<String> -> SQL array conversion, so ask the
        // driver to build a real SQL Array, declaring its Postgres element type as "text".
        Array array = ps.getConnection().createArrayOf("text", parameter.toArray());
        // Bind that array into the i-th "?" placeholder of the prepared statement.
        ps.setArray(i, array);
    }

    // Postgres -> Java, by column name.
    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return toList(rs.getArray(columnName));
    }

    // Postgres -> Java, by column index.
    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return toList(rs.getArray(columnIndex));
    }

    // Postgres -> Java, when the column comes from a stored-procedure call (CallableStatement)
    // instead of a normal query ResultSet.
    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return toList(cs.getArray(columnIndex));
    }

    // Shared conversion: raw JDBC Array -> immutable List<String>.
    // Used by all 3 getNullableResult overloads above so the logic lives in one place.
    private List<String> toList(Array array) throws SQLException {
        if (array == null) {
            // Postgres column was NULL: return an empty list, not null, so callers
            // never need a null-check on the tag list.
            return Collections.emptyList();
        }
        // Unwrap the JDBC Array into a plain Java array; "text[]" maps to String[].
        String[] values = (String[]) array.getArray();
        // Driver can return a null inner array even when the wrapper isn't null —
        // guard again before wrapping it as an immutable list.
        return values == null ? Collections.emptyList() : List.of(values);
    }
}
