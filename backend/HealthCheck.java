import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse.BodyHandlers;
public class HealthCheck {
    public static void main(String[] args) throws InterruptedException, IOException {
        var client = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:8080/api/v1/public/json"))
                .header("accept", "application/json")
                .build();
        var response = client.send(request, BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() > 299) {
            throw new RuntimeException("Healthcheck failed");
        }
    }
}
