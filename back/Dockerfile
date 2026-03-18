# 개발용 실행 이미지
FROM eclipse-temurin:17-jdk AS dev
WORKDIR /app
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x ./gradlew
RUN ./gradlew dependencies > /dev/null 2>&1 || true

EXPOSE 8080

CMD ["./gradlew", "bootRun", "--continuous"]

# 1단계: 빌드
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew clean bootJar

# 2단계: 실행 (jre 사용)
FROM eclipse-temurin:17-jre AS prod
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
