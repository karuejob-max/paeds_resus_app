-- Provider Performance Metrics Tables

-- Provider Statistics Table
CREATE TABLE IF NOT EXISTS providerStats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  totalPatientsServed INT DEFAULT 0,
  totalInterventions INT DEFAULT 0,
  averageResponseTime DECIMAL(10, 2) DEFAULT 0, -- in minutes
  successRate DECIMAL(5, 2) DEFAULT 0, -- percentage 0-100
  patientsImproved INT DEFAULT 0,
  certificationsCompleted INT DEFAULT 0,
  trainingHoursCompleted INT DEFAULT 0,
  performanceScore DECIMAL(5, 2) DEFAULT 0, -- 0-100
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider (userId)
);

-- Leaderboard Rankings Table
CREATE TABLE IF NOT EXISTS leaderboardRankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  category VARCHAR(255) NOT NULL, -- 'performance', 'interventions', 'patients_served', 'training'
  rank INT NOT NULL,
  score DECIMAL(10, 2) NOT NULL,
  percentile DECIMAL(5, 2) DEFAULT 0, -- 0-100
  previousRank INT,
  rankChange INT DEFAULT 0, -- positive = improvement
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ranking (userId, category),
  INDEX idx_category_rank (category, rank),
  INDEX idx_score_desc (category, score DESC)
);

-- Performance Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  achievementType VARCHAR(255) NOT NULL, -- 'milestone', 'badge', 'certification', 'record'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255), -- emoji or icon reference
  earnedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_earned (userId, earnedAt DESC)
);

-- Performance History Table (for trend analysis)
CREATE TABLE IF NOT EXISTS performanceHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  metricType VARCHAR(255) NOT NULL, -- 'success_rate', 'response_time', 'patients_served', etc.
  value DECIMAL(10, 2) NOT NULL,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_metric_date (userId, metricType, recordedAt DESC)
);

-- Team Performance Table (for institutional comparisons)
CREATE TABLE IF NOT EXISTS teamPerformance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institutionalAccountId INT NOT NULL,
  teamName VARCHAR(255),
  totalStaffCount INT DEFAULT 0,
  averagePerformanceScore DECIMAL(5, 2) DEFAULT 0,
  totalPatientsServed INT DEFAULT 0,
  totalInterventions INT DEFAULT 0,
  teamRank INT,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institutionalAccountId) REFERENCES institutionalAccounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team (institutionalAccountId)
);

-- Real-time Performance Events Table
CREATE TABLE IF NOT EXISTS performanceEvents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  eventType VARCHAR(255) NOT NULL, -- 'intervention_completed', 'patient_improved', 'training_completed', etc.
  eventData JSON,
  severity VARCHAR(50), -- 'info', 'warning', 'critical'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (userId, createdAt DESC),
  INDEX idx_event_type (eventType)
);

-- Create indexes for performance queries
CREATE INDEX idx_provider_stats_score ON providerStats(performanceScore DESC);
CREATE INDEX idx_provider_stats_patients ON providerStats(totalPatientsServed DESC);
CREATE INDEX idx_provider_stats_interventions ON providerStats(totalInterventions DESC);
