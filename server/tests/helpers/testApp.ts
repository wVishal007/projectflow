import { createApp } from '../../src/app';
import express from 'express';

export function createTestApp() {
  const app = createApp();
  return app;
}
