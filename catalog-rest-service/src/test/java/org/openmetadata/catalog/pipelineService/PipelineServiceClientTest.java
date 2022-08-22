package org.openmetadata.catalog.pipelineService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.Test;
import org.openmetadata.catalog.exception.PipelineServiceVersionException;

public class PipelineServiceClientTest {

    MockPipelineServiceClient mockPipelineServiceClient = new MockPipelineServiceClient(
            "user", "password", "https://endpoint.com", 10
    );

    @Test
    public void testGetVersionFromString() {
        String version = mockPipelineServiceClient.getVersionFromString("0.12.0.dev0");
        assertEquals(version, "0.12.0");
    }

    @Test
    public void testGetVersionFromStringRaises() {
        Exception exception =
                assertThrows(
                        PipelineServiceVersionException.class, () -> mockPipelineServiceClient.getVersionFromString("random")
                );

        String expectedMessage = "Cannot extract version x.y.z from random";
        String actualMessage = exception.getMessage();

        assertEquals(expectedMessage, actualMessage);
    }

}
