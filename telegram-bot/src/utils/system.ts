import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemInfo } from '../types';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export class SystemUtils {
  static async getSystemInfo(): Promise<SystemInfo> {
    try {
      const [uptime, memory, cpu, disk] = await Promise.all([
        this.getUptime(),
        this.getMemoryInfo(),
        this.getCpuUsage(),
        this.getDiskInfo(),
      ]);

      return {
        uptime,
        memory,
        cpu,
        disk,
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw error;
    }
  }

  private static async getUptime(): Promise<number> {
    try {
      const { stdout } = await execAsync('cat /proc/uptime');
      return parseFloat(stdout.split(' ')[0]);
    } catch (error) {
      return 0;
    }
  }

  private static async getMemoryInfo(): Promise<SystemInfo['memory']> {
    try {
      const data = await fs.readFile('/proc/meminfo', 'utf8');
      const lines = data.split('\n');
      
      const memTotal = this.parseMemInfoLine(lines.find(line => line.startsWith('MemTotal:')) || '');
      const memFree = this.parseMemInfoLine(lines.find(line => line.startsWith('MemFree:')) || '');
      const memAvailable = this.parseMemInfoLine(lines.find(line => line.startsWith('MemAvailable:')) || '');
      
      const total = memTotal * 1024; // Convert from KB to bytes
      const free = (memAvailable || memFree) * 1024;
      const used = total - free;

      return { total, free, used };
    } catch (error) {
      return { total: 0, free: 0, used: 0 };
    }
  }

  private static parseMemInfoLine(line: string): number {
    const match = line.match(/(\d+)\s*kB/);
    return match ? parseInt(match[1]) : 0;
  }

  private static async getCpuUsage(): Promise<SystemInfo['cpu']> {
    try {
      // Read CPU stats twice with a small delay to calculate usage
      const stat1 = await this.readCpuStat();
      await new Promise(resolve => setTimeout(resolve, 100));
      const stat2 = await this.readCpuStat();

      const idle1 = stat1.idle + stat1.iowait;
      const nonIdle1 = stat1.user + stat1.nice + stat1.system + stat1.irq + stat1.softirq + stat1.steal;
      const total1 = idle1 + nonIdle1;

      const idle2 = stat2.idle + stat2.iowait;
      const nonIdle2 = stat2.user + stat2.nice + stat2.system + stat2.irq + stat2.softirq + stat2.steal;
      const total2 = idle2 + nonIdle2;

      const totalDiff = total2 - total1;
      const idleDiff = idle2 - idle1;

      const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;

      return { usage: Math.round(usage * 100) / 100 };
    } catch (error) {
      return { usage: 0 };
    }
  }

  private static async readCpuStat() {
    const data = await fs.readFile('/proc/stat', 'utf8');
    const cpuLine = data.split('\n')[0];
    const values = cpuLine.split(/\s+/).slice(1).map(Number);
    
    return {
      user: values[0] || 0,
      nice: values[1] || 0,
      system: values[2] || 0,
      idle: values[3] || 0,
      iowait: values[4] || 0,
      irq: values[5] || 0,
      softirq: values[6] || 0,
      steal: values[7] || 0,
    };
  }

  private static async getDiskInfo(): Promise<SystemInfo['disk']> {
    try {
      const { stdout } = await execAsync('df -B1 /');
      const lines = stdout.trim().split('\n');
      const dataLine = lines[1].split(/\s+/);
      
      const total = parseInt(dataLine[1]) || 0;
      const used = parseInt(dataLine[2]) || 0;
      const free = parseInt(dataLine[3]) || 0;

      return { total, used, free };
    } catch (error) {
      return { total: 0, used: 0, free: 0 };
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}