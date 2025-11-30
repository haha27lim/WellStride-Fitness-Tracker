FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-ea-slim-buster
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN groupadd app && useradd -g app -s /bin/bash -m app
RUN chown app:app /app/app.jar
USER app
ENTRYPOINT ["java", "-jar", "/app/app.jar"]