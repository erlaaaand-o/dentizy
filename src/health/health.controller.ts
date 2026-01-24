import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Basic health check
   * Disarankan SkipThrottle agar monitoring tools tidak terblokir
   */
  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Cek status dasar aplikasi' })
  @ApiResponse({
    status: 200,
    description: 'Aplikasi berjalan normal',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-11-20T10:00:00.000Z',
        uptime: 120.5,
        environment: 'development',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Detailed health check (DB & Memory)
   * Karena ini berat (query DB), boleh di-throttle tapi jangan terlalu ketat
   */
  @Get('details')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 request/menit
  @ApiOperation({ summary: 'Cek kesehatan detail (DB & Memory)' })
  @ApiResponse({ status: 200, description: 'Detail sistem' })
  async checkDetails() {
    const startTime = Date.now();
    let dbStatus = 'down';
    let dbMessage = 'Database connection failed';
    let dbResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      // Query ringan untuk tes koneksi
      await this.dataSource.query('SELECT 1');
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'up';
      dbMessage = 'Database connection successful';
    } catch (error) {
      dbMessage = `Database error: ${error.message}`;
    }

    const totalResponseTime = Date.now() - startTime;

    return {
      status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        api: {
          status: 'up',
          responseTime: `${totalResponseTime}ms`,
        },
        database: {
          status: dbStatus,
          message: dbMessage,
          responseTime: `${dbResponseTime}ms`,
        },
      },
      system: {
        uptime: `${Math.floor(process.uptime())}s`,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      },
    };
  }

  /**
   * Liveness Probe (K8s)
   * Apakah container hidup?
   */
  @Get('live')
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness Probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Container hidup' })
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness Probe (K8s)
   * Apakah aplikasi siap menerima traffic? (Cek DB)
   * PENTING: Harus return 503 jika DB mati.
   */
  @Get('ready')
  @SkipThrottle()
  @ApiOperation({ summary: 'Readiness Probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Siap menerima traffic' })
  @ApiResponse({ status: 503, description: 'Tidak siap (DB Down)' })
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Throw HTTP Exception agar status code jadi 503
      throw new ServiceUnavailableException({
        status: 'not_ready',
        reason: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
