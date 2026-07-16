import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';
import { Text } from './Typography';

export interface TableColumn {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
}

export interface TableRow {
  [key: string]: React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
  showAlternatingRows?: boolean;
  footer?: TableRow;
}

export const Table = ({ 
  columns, 
  rows, 
  showAlternatingRows = true,
  footer
}: TableProps) => {
  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        {columns.map((column, index) => {
          const headerCellStyle = [
            styles.headerCell, 
            { width: column.width || 'auto' } as any
          ];
          if (index === 0) headerCellStyle.push({ borderTopLeftRadius: 8 } as any);
          if (index === columns.length - 1) headerCellStyle.push({ borderTopRightRadius: 8 } as any);
          return (
            <View 
              key={column.key}
              style={headerCellStyle}
            >
              <Text
                size={FontSizes.SM}
                weight="bold"
                color={Colors.WHITE}
                align={column.headerAlign || column.align || 'left'}
              >
                {column.header}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Table Body */}
      {rows.map((row, rowIndex) => {
        const bodyRowStyle = [styles.bodyRow];
        if (showAlternatingRows && rowIndex % 2 === 1) bodyRowStyle.push({ backgroundColor: Colors.BACKGROUND } as any);
        if (rowIndex === rows.length - 1 && !footer) {
          bodyRowStyle.push({ 
            borderBottomLeftRadius: 8, 
            borderBottomRightRadius: 8,
            borderBottomWidth: 1,
          } as any);
        }
        return (
          <View 
            key={rowIndex}
            style={bodyRowStyle}
          >
            {columns.map((column, colIndex) => (
              <View 
                key={column.key}
                style={[
                  styles.bodyCell,
                  { width: column.width || 'auto' },
                ]}
              >
                {typeof row[column.key] === 'string' || typeof row[column.key] === 'number' ? (
                  <Text
                    size={FontSizes.MD}
                    align={column.align || 'left'}
                  >
                    {row[column.key]}
                  </Text>
                ) : (
                  row[column.key]
                )}
              </View>
            ))}
          </View>
        );
      })}

      {/* Table Footer */}
      {footer && (
        <View style={styles.footerRow}>
          {columns.map((column, index) => {
            const footerCellStyle = [
              styles.footerCell, 
              { width: column.width || 'auto' } as any
            ];
            if (index === 0) footerCellStyle.push({ borderBottomLeftRadius: 8 } as any);
            if (index === columns.length - 1) footerCellStyle.push({ borderBottomRightRadius: 8 } as any);
            return (
              <View 
                key={column.key}
                style={footerCellStyle}
              >
                {typeof footer[column.key] === 'string' || typeof footer[column.key] === 'number' ? (
                  <Text
                    size={FontSizes.MD}
                    weight="bold"
                    color={Colors.PRIMARY}
                    align={column.align || 'left'}
                  >
                    {footer[column.key]}
                  </Text>
                ) : (
                  footer[column.key]
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.MD,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.PRIMARY,
  },
  headerCell: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRightWidth: 1,
    borderRightColor: Colors.PRIMARY,
  },
  bodyRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: Colors.BORDER,
    borderRightColor: Colors.BORDER,
  },
  bodyCell: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.SM,
    borderRightWidth: 1,
    borderRightColor: Colors.BORDER,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
    minHeight: 24,
  },
  footerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.PRIMARY,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: Colors.PRIMARY,
    borderRightColor: Colors.PRIMARY,
    borderBottomColor: Colors.PRIMARY,
  },
  footerCell: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderRightWidth: 1,
    borderRightColor: Colors.PRIMARY,
  },
});
