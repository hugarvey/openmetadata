package org.openmetadata.catalog.selenium.pages.common;


import com.google.gson.JsonParseException;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;


import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.*;

public class ApiTests {

        @Test
        public void changeServiceDescription() throws JsonParseException {
            try {
                RestAssured.baseURI = "http://localhost:8585";
                String response = given().log().all()
                        .contentType(ContentType.JSON).body(PayLoad.changeDescriptionServices())
                        .when()
                        .put("api/v1/services/databaseServices")
                        .then().assertThat().extract().response().getBody().asString();
                System.out.println("Updated Response=" + response);

            } catch (com.google.gson.JsonParseException e) {
                e.printStackTrace();
            }

        }
        @Test
        public void changeDatabaseDescription() throws JsonParseException {
            try {
                RestAssured.baseURI = "http://localhost:8585";
                String response = given().log().all()
                        .contentType("application/json-patch+json").body(PayLoad.changeDescriptionDatabase())
                        .when()
                        .patch("api/v1/databases/535a088b-34f6-4aee-9ed4-9d368c54a08a")
                        .then().assertThat().extract().response().getBody().asString();

                System.out.println("Updated Response=" + response);

            } catch (com.google.gson.JsonParseException e) {
                e.printStackTrace();
            }

        }
    }

