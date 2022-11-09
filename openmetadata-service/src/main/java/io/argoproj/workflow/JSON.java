/*
 * Argo Workflows API
 * Argo Workflows is an open source container-native workflow engine for orchestrating parallel jobs on Kubernetes. For more information, please see https://argoproj.github.io/argo-workflows/
 *
 * The version of the OpenAPI document: VERSION
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

package io.argoproj.workflow;

import static java.time.format.DateTimeFormatter.ISO_INSTANT;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.TypeAdapter;
import com.google.gson.internal.bind.util.ISO8601Utils;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.argoproj.workflow.models.*;
import io.gsonfire.GsonFireBuilder;
import java.io.IOException;
import java.io.StringReader;
import java.lang.reflect.Type;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.ParsePosition;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Map;
import okio.ByteString;

public class JSON {
  private Gson gson;
  private boolean isLenientOnJson = false;
  private DateTypeAdapter dateTypeAdapter = new DateTypeAdapter();
  private SqlDateTypeAdapter sqlDateTypeAdapter = new SqlDateTypeAdapter();
  private OffsetDateTimeTypeAdapter offsetDateTimeTypeAdapter = new OffsetDateTimeTypeAdapter();
  private LocalDateTypeAdapter localDateTypeAdapter = new LocalDateTypeAdapter();
  private ByteArrayAdapter byteArrayAdapter = new ByteArrayAdapter();

  private InstantTypeAdapter instantTypeAdapter = new InstantTypeAdapter();

  private static final DateTimeFormatter FORMATTER = ISO_INSTANT;

  public static class InstantTypeAdapter extends TypeAdapter<Instant> {

    private Instant dateFormat;

    public InstantTypeAdapter() {}

    public InstantTypeAdapter(Instant instant) {
      this.dateFormat = dateFormat;
    }

    public void setFormat(Instant instant) {
      this.dateFormat = dateFormat;
    }

    @Override
    public void write(JsonWriter out, Instant date) throws IOException {
      if (date == null) {
        out.nullValue();
      } else {
        out.value(FORMATTER.format(date));
      }
    }

    @Override
    public Instant read(JsonReader in) throws IOException {
      try {
        switch (in.peek()) {
          case NULL:
            in.nextNull();
            return null;
          default:
            String date = in.nextString();
            if (date == null) {
              return null;
            }
            return FORMATTER.parse(date, Instant::from);
        }
      } catch (IllegalArgumentException e) {
        throw new JsonParseException(e);
      }
    }
  }

  @SuppressWarnings("unchecked")
  public static GsonBuilder createGson() {
    GsonFireBuilder fireBuilder = new GsonFireBuilder();
    GsonBuilder builder = fireBuilder.createGsonBuilder();
    return builder;
  }

  private static String getDiscriminatorValue(JsonElement readElement, String discriminatorField) {
    JsonElement element = readElement.getAsJsonObject().get(discriminatorField);
    if (null == element) {
      throw new IllegalArgumentException("missing discriminator field: <" + discriminatorField + ">");
    }
    return element.getAsString();
  }

  /**
   * Returns the Java class that implements the OpenAPI schema for the specified discriminator value.
   *
   * @param classByDiscriminatorValue The map of discriminator values to Java classes.
   * @param discriminatorValue The value of the OpenAPI discriminator in the input data.
   * @return The Java class that implements the OpenAPI schema
   */
  private static Class getClassByDiscriminator(Map classByDiscriminatorValue, String discriminatorValue) {
    Class clazz = (Class) classByDiscriminatorValue.get(discriminatorValue);
    if (null == clazz) {
      throw new IllegalArgumentException("cannot determine model class of name: <" + discriminatorValue + ">");
    }
    return clazz;
  }

  public JSON() {
    gson =
        createGson()
            .registerTypeAdapter(Date.class, dateTypeAdapter)
            .registerTypeAdapter(Instant.class, instantTypeAdapter)
            .registerTypeAdapter(java.sql.Date.class, sqlDateTypeAdapter)
            .registerTypeAdapter(OffsetDateTime.class, offsetDateTimeTypeAdapter)
            .registerTypeAdapter(LocalDate.class, localDateTypeAdapter)
            .registerTypeAdapter(byte[].class, byteArrayAdapter)
            .create();
  }

  /**
   * Get Gson.
   *
   * @return Gson
   */
  public Gson getGson() {
    return gson;
  }

  /**
   * Set Gson.
   *
   * @param gson Gson
   * @return JSON
   */
  public JSON setGson(Gson gson) {
    this.gson = gson;
    return this;
  }

  public JSON setLenientOnJson(boolean lenientOnJson) {
    isLenientOnJson = lenientOnJson;
    return this;
  }

  /**
   * Serialize the given Java object into JSON string.
   *
   * @param obj Object
   * @return String representation of the JSON
   */
  public String serialize(Object obj) {
    return gson.toJson(obj);
  }

  /**
   * Deserialize the given JSON string to Java object.
   *
   * @param <T> Type
   * @param body The JSON string
   * @param returnType The type to deserialize into
   * @return The deserialized Java object
   */
  @SuppressWarnings("unchecked")
  public <T> T deserialize(String body, Type returnType) {
    try {
      if (isLenientOnJson) {
        JsonReader jsonReader = new JsonReader(new StringReader(body));
        // see
        // https://google-gson.googlecode.com/svn/trunk/gson/docs/javadocs/com/google/gson/stream/JsonReader.html#setLenient(boolean)
        jsonReader.setLenient(true);
        return gson.fromJson(jsonReader, returnType);
      } else {
        return gson.fromJson(body, returnType);
      }
    } catch (JsonParseException e) {
      // Fallback processing when failed to parse JSON form response body:
      // return the response body string directly for the String return type;
      if (returnType.equals(String.class)) {
        return (T) body;
      } else {
        throw (e);
      }
    }
  }

  /** Gson TypeAdapter for Byte Array type */
  public class ByteArrayAdapter extends TypeAdapter<byte[]> {

    @Override
    public void write(JsonWriter out, byte[] value) throws IOException {
      if (value == null) {
        out.nullValue();
      } else {
        out.value(ByteString.of(value).base64());
      }
    }

    @Override
    public byte[] read(JsonReader in) throws IOException {
      switch (in.peek()) {
        case NULL:
          in.nextNull();
          return null;
        default:
          String bytesAsBase64 = in.nextString();
          ByteString byteString = ByteString.decodeBase64(bytesAsBase64);
          return byteString.toByteArray();
      }
    }
  }

  /** Gson TypeAdapter for JSR310 OffsetDateTime type */
  public static class OffsetDateTimeTypeAdapter extends TypeAdapter<OffsetDateTime> {

    private DateTimeFormatter formatter;

    public OffsetDateTimeTypeAdapter() {
      this(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    public OffsetDateTimeTypeAdapter(DateTimeFormatter formatter) {
      this.formatter = formatter;
    }

    public void setFormat(DateTimeFormatter dateFormat) {
      this.formatter = dateFormat;
    }

    @Override
    public void write(JsonWriter out, OffsetDateTime date) throws IOException {
      if (date == null) {
        out.nullValue();
      } else {
        out.value(formatter.format(date));
      }
    }

    @Override
    public OffsetDateTime read(JsonReader in) throws IOException {
      switch (in.peek()) {
        case NULL:
          in.nextNull();
          return null;
        default:
          String date = in.nextString();
          if (date.endsWith("+0000")) {
            date = date.substring(0, date.length() - 5) + "Z";
          }
          return OffsetDateTime.parse(date, formatter);
      }
    }
  }

  /** Gson TypeAdapter for JSR310 LocalDate type */
  public class LocalDateTypeAdapter extends TypeAdapter<LocalDate> {

    private DateTimeFormatter formatter;

    public LocalDateTypeAdapter() {
      this(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    public LocalDateTypeAdapter(DateTimeFormatter formatter) {
      this.formatter = formatter;
    }

    public void setFormat(DateTimeFormatter dateFormat) {
      this.formatter = dateFormat;
    }

    @Override
    public void write(JsonWriter out, LocalDate date) throws IOException {
      if (date == null) {
        out.nullValue();
      } else {
        out.value(formatter.format(date));
      }
    }

    @Override
    public LocalDate read(JsonReader in) throws IOException {
      switch (in.peek()) {
        case NULL:
          in.nextNull();
          return null;
        default:
          String date = in.nextString();
          return LocalDate.parse(date, formatter);
      }
    }
  }

  public JSON setOffsetDateTimeFormat(DateTimeFormatter dateFormat) {
    offsetDateTimeTypeAdapter.setFormat(dateFormat);
    return this;
  }

  public JSON setLocalDateFormat(DateTimeFormatter dateFormat) {
    localDateTypeAdapter.setFormat(dateFormat);
    return this;
  }

  /**
   * Gson TypeAdapter for java.sql.Date type If the dateFormat is null, a simple "yyyy-MM-dd" format will be used (more
   * efficient than SimpleDateFormat).
   */
  public static class SqlDateTypeAdapter extends TypeAdapter<java.sql.Date> {

    private DateFormat dateFormat;

    public SqlDateTypeAdapter() {}

    public SqlDateTypeAdapter(DateFormat dateFormat) {
      this.dateFormat = dateFormat;
    }

    public void setFormat(DateFormat dateFormat) {
      this.dateFormat = dateFormat;
    }

    @Override
    public void write(JsonWriter out, java.sql.Date date) throws IOException {
      if (date == null) {
        out.nullValue();
      } else {
        String value;
        if (dateFormat != null) {
          value = dateFormat.format(date);
        } else {
          value = date.toString();
        }
        out.value(value);
      }
    }

    @Override
    public java.sql.Date read(JsonReader in) throws IOException {
      switch (in.peek()) {
        case NULL:
          in.nextNull();
          return null;
        default:
          String date = in.nextString();
          try {
            if (dateFormat != null) {
              return new java.sql.Date(dateFormat.parse(date).getTime());
            }
            return new java.sql.Date(ISO8601Utils.parse(date, new ParsePosition(0)).getTime());
          } catch (ParseException e) {
            throw new JsonParseException(e);
          }
      }
    }
  }

  /** Gson TypeAdapter for java.util.Date type If the dateFormat is null, ISO8601Utils will be used. */
  public static class DateTypeAdapter extends TypeAdapter<Date> {

    private DateFormat dateFormat;

    public DateTypeAdapter() {}

    public DateTypeAdapter(DateFormat dateFormat) {
      this.dateFormat = dateFormat;
    }

    public void setFormat(DateFormat dateFormat) {
      this.dateFormat = dateFormat;
    }

    @Override
    public void write(JsonWriter out, Date date) throws IOException {
      if (date == null) {
        out.nullValue();
      } else {
        String value;
        if (dateFormat != null) {
          value = dateFormat.format(date);
        } else {
          value = ISO8601Utils.format(date, true);
        }
        out.value(value);
      }
    }

    @Override
    public Date read(JsonReader in) throws IOException {
      try {
        switch (in.peek()) {
          case NULL:
            in.nextNull();
            return null;
          default:
            String date = in.nextString();
            try {
              if (dateFormat != null) {
                return dateFormat.parse(date);
              }
              return ISO8601Utils.parse(date, new ParsePosition(0));
            } catch (ParseException e) {
              throw new JsonParseException(e);
            }
        }
      } catch (IllegalArgumentException e) {
        throw new JsonParseException(e);
      }
    }
  }

  public JSON setDateFormat(DateFormat dateFormat) {
    dateTypeAdapter.setFormat(dateFormat);
    return this;
  }

  public JSON setSqlDateFormat(DateFormat dateFormat) {
    sqlDateTypeAdapter.setFormat(dateFormat);
    return this;
  }
}
