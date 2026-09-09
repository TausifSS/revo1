# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace

# Copy backend pom.xml and source
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

# Build JAR package (skipping tests for faster deployment)
RUN mvn clean package -DskipTests

# Runtime stage (Ubuntu Jammy with glibc to prevent musl/Netty tcnative SIGSEGV crashes)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy built JAR file
COPY --from=build /workspace/target/*.jar app.jar

# Render exposes PORT dynamically (defaults to 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Run the Spring Boot application with JVM flags optimized for Render Free Tier (512MB)
# and pure Java SSL provider to prevent native Netty crashes
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=75.0 -Dio.grpc.netty.shaded.io.netty.handler.ssl.noOpenSsl=true -jar app.jar"]

