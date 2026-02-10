import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Cek status dasar aplikasi' })
  @ApiResponse({
    status: 200,
    description: 'Aplikasi berjalan normal',
    // Gunakan schema manual atau class jika sudah ada
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2024-11-20T10:00:00.000Z',
        uptime: 120.5,
        services: {
          api: { status: 'healthy', lastChecked: '...' },
          database: { status: 'healthy', lastChecked: '...' },
        },
        version: '1.0.0',
        environment: 'development',
      },
    },
  })
  check() {
    const now = new Date().toISOString();
    return {
      status: 'healthy',
      timestamp: now,
      uptime: process.uptime(),
      services: {
        api: { name: 'API', status: 'healthy', lastChecked: now },
        database: { name: 'Database', status: 'healthy', lastChecked: now },
      },
      version: '1.0.0', // Sebaiknya ambil dari package.json
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('details')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Cek kesehatan detail (DB & Memory)' })
  // SANGAT PENTING: Tambahkan schema/type agar generator tidak menghasilkan 'void'
  @ApiResponse({
    status: 200,
    description: 'Detail sistem',
    schema: {
      example: {
        status: 'healthy',
        metrics: {
          cpu: { usage: 0, cores: 4 },
          memory: { used: 100, total: 1000, percentage: 10 },
        },
      },
    },
  })
  async checkDetails() {
    const startTime = Date.now();
    let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    let dbMessage = 'Database connection failed';
    let dbResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await this.dataSource.query('SELECT 1');
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'healthy';
      dbMessage = 'Database connection successful';
    } catch (error) {
      dbMessage = `Database error: ${error instanceof Error ? error.message : error}`;
    }

    const totalResponseTime = Date.now() - startTime;
    const now = new Date().toISOString();

    // Sesuaikan dengan interface DetailedHealthCheckResponse
    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: now,
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: {
          name: 'API',
          status: 'healthy',
          responseTime: totalResponseTime,
          lastChecked: now,
        },
        database: {
          name: 'Database',
          status: dbStatus,
          message: dbMessage,
          responseTime: dbResponseTime,
          lastChecked: now,
        },
      },
      metrics: {
        cpu: { usage: 0, cores: 0 }, // Perlu library tambahan untuk real data
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round(
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
              100,
          ),
        },
        disk: { used: 0, total: 0, percentage: 0 },
      },
    };
  }

  @Get('live')
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness Probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Container hidup' })
  liveness() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @SkipThrottle()
  @ApiOperation({ summary: 'Readiness Probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Siap menerima traffic' })
  @ApiResponse({ status: 503, description: 'Tidak siap (DB Down)' })
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        reason: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
