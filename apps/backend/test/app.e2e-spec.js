"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("./../src/app.module");
describe('AppController (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.enableVersioning({
            type: common_1.VersioningType.URI,
            defaultVersion: '1',
        });
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('/v1/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/v1/health')
            .expect(200)
            .expect((res) => {
            expect(res.body.status).toBe('ok');
        });
    });
    it('/v1/dashboard/metrics (GET) should fail without auth', () => {
        return request(app.getHttpServer())
            .get('/v1/dashboard/metrics')
            .expect(401);
    });
});
//# sourceMappingURL=app.e2e-spec.js.map