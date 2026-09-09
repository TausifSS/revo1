# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

# Copy pom.xml and source
COPY pom.xml ./pom.xml
COPY src ./src

# Build JAR package (skipping tests for faster deployment)
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built JAR file
COPY --from=build /workspace/target/*.jar app.jar

# Render exposes PORT dynamically (defaults to 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Run the Spring Boot application
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
