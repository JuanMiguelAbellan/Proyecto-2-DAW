import request from "supertest";
import app from "../server";

//Hay que instalar jest y ts-jest
// describe("API E2E Tests Saludador", () => {
//   it("GET / debe responder con 'Hola, mundo!'", async () => {
//     const response = await request(app).get("/");
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({ message: "Hola, mundo!" });
//   });
// });