package database

import (
    "log"
    "os"
    
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
    dbPath := os.Getenv("DB_PATH")
    if dbPath == "" {
        dbPath = "./payom.db"
    }
    
    var err error
    DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    log.Println("✅ Database connected")
}

func Migrate(models ...interface{}) {
    if err := DB.AutoMigrate(models...); err != nil {
        log.Fatal("Migration failed:", err)
    }
    log.Println("✅ Database migrated")
}
