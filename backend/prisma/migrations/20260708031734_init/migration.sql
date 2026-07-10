-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "google_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Manager',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repairs" (
    "job_no" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "customer_name" TEXT,
    "wo" TEXT,
    "an" TEXT,
    "po" TEXT,
    "qty_in" INTEGER,
    "qty_out" INTEGER,
    "date_in" TIMESTAMP(3) NOT NULL,
    "date_out" TIMESTAMP(3),
    "unit_model" TEXT,
    "part_description" TEXT,
    "soh" TEXT,
    "remarks" TEXT,
    "status" TEXT DEFAULT 'In Progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("job_no")
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "records_read" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
