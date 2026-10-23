using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Codlek.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contact_messages",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    service = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    locale = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contact_messages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "job_openings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    title_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    title_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    department_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    department_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    location_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    location_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    type_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    type_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    description_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_openings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    slug = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    title_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    title_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    excerpt_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    excerpt_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    body_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    body_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    category_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    category_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    cover = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    is_published = table.Column<bool>(type: "bit", nullable: false),
                    published_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_posts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "project_categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    slug = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    icon = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_project_categories", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    key = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    icon = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    tone = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    image = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    title_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    title_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    summary_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    summary_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_popular = table.Column<bool>(type: "bit", nullable: false),
                    is_published = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    features = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_services", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    key = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "testimonials",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    role_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    role_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    quote_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    quote_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    rating = table.Column<byte>(type: "tinyint", nullable: false),
                    avatar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    is_published = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_testimonials", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    password = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    is_admin = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "job_applications",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    job_opening_id = table.Column<int>(type: "int", nullable: true),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    profile_url = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    cv_path = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    cv_original_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    locale = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_applications", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_applications_job_openings_job_opening_id",
                        column: x => x.job_opening_id,
                        principalTable: "job_openings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    project_category_id = table.Column<int>(type: "int", nullable: true),
                    title_ar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    title_en = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    description_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    image = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    url = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    is_featured = table.Column<bool>(type: "bit", nullable: false),
                    is_coming_soon = table.Column<bool>(type: "bit", nullable: false),
                    is_published = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_projects", x => x.id);
                    table.ForeignKey(
                        name: "fk_projects_project_categories_project_category_id",
                        column: x => x.project_category_id,
                        principalTable: "project_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_job_applications_job_opening_id",
                table: "job_applications",
                column: "job_opening_id");

            migrationBuilder.CreateIndex(
                name: "ix_posts_is_published_published_at",
                table: "posts",
                columns: new[] { "is_published", "published_at" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_slug",
                table: "posts",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_project_categories_slug",
                table: "project_categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_projects_is_published_sort_order",
                table: "projects",
                columns: new[] { "is_published", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_projects_project_category_id",
                table: "projects",
                column: "project_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_services_key",
                table: "services",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_settings_key",
                table: "settings",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contact_messages");

            migrationBuilder.DropTable(
                name: "job_applications");

            migrationBuilder.DropTable(
                name: "posts");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropTable(
                name: "services");

            migrationBuilder.DropTable(
                name: "settings");

            migrationBuilder.DropTable(
                name: "testimonials");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "job_openings");

            migrationBuilder.DropTable(
                name: "project_categories");
        }
    }
}
