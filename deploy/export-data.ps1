<#
.SYNOPSIS
    Writes the content of the local database as a SQL file of INSERTs, to load
    into the hosted database with Adminer's Import (MonsterASP: the database ->
    WebMSSQL -> Adminer). No password or remote access needed.

    The tables must exist already: the API creates them when it starts with
    Codlek__MigrateOnStartup=true. Load the file into empty tables only.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\export-data.ps1
#>
param(
    [string]$Server = '(localdb)\MSSQLLocalDB',
    [string]$Database = 'Codlek',
    [string]$Out = (Join-Path (Split-Path -Parent $PSScriptRoot) 'out\codlek-data.sql')
)

$ErrorActionPreference = 'Stop'

# Parents before children.
$tables = 'users', 'project_categories', 'projects', 'posts', 'job_openings', 'job_applications', 'contact_messages', 'services', 'testimonials', 'settings'

function Literal($value) {
    if ($null -eq $value -or $value -is [DBNull]) { return 'NULL' }
    if ($value -is [string]) { return "N'" + $value.Replace("'", "''") + "'" }
    if ($value -is [bool]) { if ($value) { return '1' } else { return '0' } }
    if ($value -is [datetime]) { return "'" + $value.ToString('yyyy-MM-ddTHH:mm:ss.fffffff') + "'" }
    return [Convert]::ToString($value, [Globalization.CultureInfo]::InvariantCulture)
}

$connection = New-Object System.Data.SqlClient.SqlConnection "Server=$Server;Database=$Database;Integrated Security=True"
$connection.Open()

$sql = New-Object System.Text.StringBuilder
[void]$sql.AppendLine('-- Codlek data, written by deploy/export-data.ps1. Load into empty tables.')
[void]$sql.AppendLine('SET NOCOUNT ON;')

try {
    foreach ($table in $tables) {
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT * FROM [$table] ORDER BY id"
        $reader = $command.ExecuteReader()
        $columns = (0..($reader.FieldCount - 1) | ForEach-Object { '[' + $reader.GetName($_) + ']' }) -join ', '
        $rows = 0

        [void]$sql.AppendLine("SET IDENTITY_INSERT [$table] ON;")
        while ($reader.Read()) {
            $values = (0..($reader.FieldCount - 1) | ForEach-Object { Literal $reader.GetValue($_) }) -join ', '
            [void]$sql.AppendLine("INSERT INTO [$table] ($columns) VALUES ($values);")
            $rows++
        }
        [void]$sql.AppendLine("SET IDENTITY_INSERT [$table] OFF;")
        $reader.Close()

        Write-Host "${table}: $rows"
    }
}
finally {
    $connection.Close()
}

New-Item -ItemType Directory -Force (Split-Path -Parent $Out) | Out-Null
# UTF-8 without a BOM: a BOM would land in the first statement.
[IO.File]::WriteAllText($Out, $sql.ToString(), (New-Object Text.UTF8Encoding $false))
Write-Host "Written: $Out"
